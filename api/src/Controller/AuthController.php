<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Security\Interface\InputValidationServiceInterface;
use App\Security\Interface\SecurityMonitoringServiceInterface;
use App\Security\Interface\TokenBlacklistServiceInterface;
use App\Security\Service\RefreshTokenServiceInterface;
use Doctrine\ORM\EntityManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/auth')]
class AuthController extends AbstractController
{
    private const REFRESH_TOKEN_TTL = 604800; // 7 days (reduced from 30 days)

    public function __construct(
        private UserPasswordHasherInterface $passwordHasher,
        private JWTTokenManagerInterface $jwtManager,
        private RefreshTokenServiceInterface $refreshTokenService,
        private RefreshTokenManagerInterface $refreshTokenManager,
        private EntityManagerInterface $entityManager,
        private InputValidationServiceInterface $inputValidation,
        private SecurityMonitoringServiceInterface $securityMonitoring,
        private TokenBlacklistServiceInterface $tokenBlacklist,
    ) {
    }

    #[Route('/login', name: 'app_auth_login', methods: ['POST'])]
    public function login(Request $request, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ipAddress = $request->getClientIp();
        $userAgent = $request->headers->get('User-Agent', 'unknown');

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json([
                'error' => 'invalid_request',
                'message' => 'Email et mot de passe requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation de l'email
        if (!$this->inputValidation->validateEmail($data['email'])) {
            $this->securityMonitoring->logFailedLogin($data['email'], $ipAddress, $userAgent);
            return $this->json([
                'error' => 'invalid_email',
                'message' => 'Format d\'email invalide',
            ], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findOneBy(['email' => $data['email']]);

        if (!$user || $user->getPassword() === null) {
            $this->securityMonitoring->logFailedLogin($data['email'], $ipAddress, $userAgent);
            return $this->json([
                'error' => 'invalid_credentials',
                'message' => $user && $user->getPassword() === null
                    ? 'Ce compte utilise uniquement Google Sign-In'
                    : 'Identifiants invalides',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->passwordHasher->isPasswordValid($user, $data['password'])) {
            $this->securityMonitoring->logFailedLogin($data['email'], $ipAddress, $userAgent);
            return $this->json([
                'error' => 'invalid_credentials',
                'message' => 'Identifiants invalides',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Login réussi
        $this->securityMonitoring->logSuccessfulLogin($data['email'], $ipAddress, $userAgent);
        return $this->generateTokenResponse($user, $request);
    }

    #[Route('/register', name: 'app_auth_register', methods: ['POST'])]
    public function register(Request $request, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json([
                'error' => 'invalid_request',
                'message' => 'Email et mot de passe requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation de l'email
        if (!$this->inputValidation->validateEmail($data['email'])) {
            return $this->json([
                'error' => 'invalid_email',
                'message' => 'Format d\'email invalide',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation renforcée de la force du mot de passe
        $passwordErrors = $this->inputValidation->validatePasswordStrength($data['password']);
        if (!empty($passwordErrors)) {
            return $this->json([
                'error' => 'weak_password',
                'message' => 'Le mot de passe ne respecte pas les critères de sécurité',
                'details' => $passwordErrors,
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier si l'email existe déjà
        if ($userRepository->findOneBy(['email' => $data['email']])) {
            return $this->json([
                'error' => 'email_exists',
                'message' => 'Un compte avec cet email existe déjà',
            ], Response::HTTP_CONFLICT);
        }

        // Créer le nouvel utilisateur
        $user = new User();
        $user->setEmail($data['email']);
        $user->setPassword($this->passwordHasher->hashPassword($user, $data['password']));
        $user->setName($data['name'] ?? null);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $this->generateTokenResponse($user, $request, Response::HTTP_CREATED);
    }

    #[Route('/refresh', name: 'app_auth_refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ipAddress = $request->getClientIp();
        $userAgent = $request->headers->get('User-Agent', 'unknown');

        if (!isset($data['refresh_token'])) {
            return $this->json([
                'error' => 'invalid_request',
                'message' => 'Refresh token requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        $plaintextToken = $data['refresh_token'];

        // SÉCURITÉ RENFORCÉE: Vérification avec détection de réutilisation
        // - Recherche par hash SHA256 (sécurisé)
        // - Détection de token déjà rotaté (attaque de réutilisation)
        // - Révocation automatique de la chaîne en cas de breach
        if (!$this->refreshTokenService->verifyToken($plaintextToken)) {
            // Token invalide, expiré, rotaté, ou révoqué
            // Si rotaté: la chaîne complète a été révoquée automatiquement
            return $this->json([
                'error' => 'invalid_token',
                'message' => 'Refresh token invalide, expiré ou révoqué',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Récupérer le token validé
        $oldToken = $this->refreshTokenService->findByPlaintextToken($plaintextToken);

        if (!$oldToken) {
            return $this->json([
                'error' => 'invalid_token',
                'message' => 'Refresh token non trouvé',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Récupérer l'utilisateur
        $userRepository = $this->entityManager->getRepository(User::class);
        $user = $userRepository->findOneBy(['email' => $oldToken->getUsername()]);

        if (!$user) {
            return $this->json([
                'error' => 'user_not_found',
                'message' => 'Utilisateur non trouvé',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Générer un nouveau access token JWT
        $accessToken = $this->jwtManager->create($user);

        // SÉCURITÉ: Rotation avec tracking complet
        // - Hash SHA256 du nouveau token
        // - Lien avec l'ancien token (rotation chain)
        // - Tracking IP et User-Agent
        // - Timestamp de rotation
        $newPlaintextToken = bin2hex(random_bytes(64)); // Generate new secure token
        $this->refreshTokenService->rotateToken(
            $oldToken,
            $newPlaintextToken,
            $ipAddress,
            $userAgent
        );

        // Logging pour surveillance avec métadonnées
        $this->securityMonitoring->logTokenRefresh(
            $user->getUserIdentifier(),
            $ipAddress,
            [
                'user_agent' => $userAgent,
                'rotation_chain_id' => $oldToken->getId(),
            ]
        );

        // Ajouter les headers de rate limit si disponibles
        $response = $this->json([
            'access_token' => $accessToken,
            'refresh_token' => $newPlaintextToken, // Return plaintext to client
            'token_type' => 'Bearer',
            'expires_in' => (int) ($_ENV['JWT_TOKEN_TTL'] ?? 3600),
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
            ],
        ]);

        $this->addRateLimitHeaders($request, $response);

        return $response;
    }

    #[Route('/logout', name: 'app_auth_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        $ipAddress = $request->getClientIp();

        if (!isset($data['refresh_token'])) {
            return $this->json([
                'error' => 'invalid_request',
                'message' => 'Refresh token requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        // SÉCURITÉ RENFORCÉE: Utiliser RefreshTokenService pour trouver le token hashé
        $refreshToken = $this->refreshTokenService->findByPlaintextToken($data['refresh_token']);

        if ($refreshToken) {
            $userIdentifier = $refreshToken->getUsername();

            // Marquer le token comme révoqué (plus sûr que la suppression)
            $refreshToken->setRevokedAt(new \DateTime());
            $this->entityManager->persist($refreshToken);
            $this->entityManager->flush();

            // SÉCURITÉ: Blacklister l'access token si fourni
            if (isset($data['access_token'])) {
                $accessTokenTtl = (int) ($_ENV['JWT_TOKEN_TTL'] ?? 3600);
                $this->tokenBlacklist->blacklistToken($data['access_token'], $accessTokenTtl);
            }

            // Logging pour surveillance
            $this->securityMonitoring->logLogout($userIdentifier, $ipAddress);
        }

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/status', name: 'app_auth_status', methods: ['GET'])]
    public function status(): JsonResponse
    {
        return $this->json([
            'auth_methods' => [
                'email_password' => true,
                'google_sso' => filter_var($_ENV['SSO_ENABLED'] ?? 'false', FILTER_VALIDATE_BOOLEAN),
            ],
            'api_version' => 'v1',
        ]);
    }


    private function generateTokenResponse(User $user, Request $request, int $statusCode = Response::HTTP_OK): JsonResponse
    {
        // Générer le JWT access token
        $accessToken = $this->jwtManager->create($user);

        // SÉCURITÉ RENFORCÉE: Utiliser RefreshTokenService avec token hashing
        // - Génère un token aléatoire sécurisé (128 caractères)
        // - Hash SHA256 pour stockage en base
        // - Tracking IP et User-Agent pour sécurité
        $plaintextToken = bin2hex(random_bytes(64));
        $this->refreshTokenService->createToken(
            $user,
            $plaintextToken,
            self::REFRESH_TOKEN_TTL,
            $request->getClientIp(),
            $request->headers->get('User-Agent', 'unknown')
        );

        $response = $this->json([
            'access_token' => $accessToken,
            'refresh_token' => $plaintextToken, // Return plaintext to client
            'token_type' => 'Bearer',
            'expires_in' => (int) ($_ENV['JWT_TOKEN_TTL'] ?? 3600),
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'name' => $user->getName(),
                'picture' => $user->getPicture(),
                'roles' => $user->getRoles(),
                'created_at' => $user->getCreatedAt()?->format('c'),
                'has_google_account' => $user->getGoogleId() !== null,
            ],
        ], $statusCode);

        // Ajouter les headers de rate limit
        $this->addRateLimitHeaders($request, $response);

        return $response;
    }

    private function addRateLimitHeaders(Request $request, JsonResponse $response): void
    {
        $rateLimit = $request->attributes->get('rate_limit');
        if ($rateLimit !== null) {
            $response->headers->set('X-RateLimit-Limit', (string) $rateLimit['limit']);
            $response->headers->set('X-RateLimit-Remaining', (string) $rateLimit['remaining']);
            $response->headers->set('X-RateLimit-Reset', (string) $rateLimit['reset']);
        }
    }
}
