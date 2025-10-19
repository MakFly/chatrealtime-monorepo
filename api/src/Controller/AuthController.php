<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher,
        private JWTTokenManagerInterface $jwtManager,
        private RefreshTokenGeneratorInterface $refreshTokenGenerator,
        private RefreshTokenManagerInterface $refreshTokenManager,
        private EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/login', name: 'app_auth_login', methods: ['POST'])]
    public function login(Request $request, UserRepository $userRepository): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            return $this->json([
                'error' => 'invalid_request',
                'message' => 'Email et mot de passe requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        $user = $userRepository->findOneBy(['email' => $data['email']]);

        if (!$user || $user->getPassword() === null) {
            return $this->json([
                'error' => 'invalid_credentials',
                'message' => $user && $user->getPassword() === null
                    ? 'Ce compte utilise uniquement Google Sign-In'
                    : 'Identifiants invalides',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$this->passwordHasher->isPasswordValid($user, $data['password'])) {
            return $this->json([
                'error' => 'invalid_credentials',
                'message' => 'Identifiants invalides',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $this->generateTokenResponse($user);
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

        // Validation du mot de passe (minimum 8 caractères)
        if (strlen($data['password']) < 8) {
            return $this->json([
                'error' => 'password_too_short',
                'message' => 'Le mot de passe doit contenir au moins 8 caractères',
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

        return $this->generateTokenResponse($user, Response::HTTP_CREATED);
    }

    #[Route('/refresh', name: 'app_auth_refresh', methods: ['POST'])]
    public function refresh(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['refresh_token'])) {
            return $this->json([
                'error' => 'invalid_request',
                'message' => 'Refresh token requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        $refreshToken = $this->refreshTokenManager->get($data['refresh_token']);

        if (!$refreshToken || !$refreshToken->isValid()) {
            return $this->json([
                'error' => 'invalid_token',
                'message' => 'Refresh token invalide ou expiré',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Récupérer l'utilisateur
        $userRepository = $this->entityManager->getRepository(User::class);
        $user = $userRepository->findOneBy(['email' => $refreshToken->getUsername()]);

        if (!$user) {
            return $this->json([
                'error' => 'user_not_found',
                'message' => 'Utilisateur non trouvé',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Générer un nouveau access token
        $accessToken = $this->jwtManager->create($user);

        return $this->json([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken->getRefreshToken(),
        ]);
    }

    #[Route('/logout', name: 'app_auth_logout', methods: ['POST'])]
    public function logout(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!isset($data['refresh_token'])) {
            return $this->json([
                'error' => 'invalid_request',
                'message' => 'Refresh token requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        $refreshToken = $this->refreshTokenManager->get($data['refresh_token']);

        if ($refreshToken) {
            $this->refreshTokenManager->delete($refreshToken);
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


    private function generateTokenResponse(User $user, int $statusCode = Response::HTTP_OK): JsonResponse
    {
        // Générer le JWT access token
        $accessToken = $this->jwtManager->create($user);

        // Générer le refresh token
        $refreshToken = $this->refreshTokenGenerator->createForUserWithTtl(
            $user,
            (int) ($_ENV['JWT_REFRESH_TOKEN_TTL'] ?? 2592000)
        );
        $this->refreshTokenManager->save($refreshToken);

        return $this->json([
            'access_token' => $accessToken,
            'refresh_token' => $refreshToken->getRefreshToken(),
            'token_type' => 'Bearer',
            'expires_in' => (int) ($_ENV['JWT_TOKEN_TTL'] ?? 3600),
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'name' => $user->getName(),
                'picture' => $user->getPicture(),
            ],
        ], $statusCode);
    }
}
