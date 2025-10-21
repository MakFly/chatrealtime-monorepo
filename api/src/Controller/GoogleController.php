<?php

declare(strict_types=1);

namespace App\Controller;

use App\Security\Service\RefreshTokenServiceInterface;
use App\Service\GoogleUserProvisioner;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/v1/auth/google')]
class GoogleController extends AbstractController
{
    public function __construct(
        private ClientRegistry $clientRegistry,
        private GoogleUserProvisioner $userProvisioner,
        private JWTTokenManagerInterface $jwtManager,
        private RefreshTokenServiceInterface $refreshTokenService,
    ) {}

    #[Route('', name: 'app_google_connect', methods: ['GET'])]
    public function connect(): RedirectResponse|Response
    {
        // Vérifier si le SSO est activé
        if (!$this->isSsoEnabled()) {
            return $this->json([
                'error' => 'sso_disabled',
                'message' => 'L\'authentification Google SSO est désactivée',
            ], Response::HTTP_FORBIDDEN);
        }

        // Rediriger vers Google OAuth
        return $this->clientRegistry
            ->getClient('google')
            ->redirect([
                'email',
                'profile',
            ], []);
    }

    #[Route('/callback', name: 'app_google_callback', methods: ['GET'])]
    public function callback(Request $request): Response
    {
        // Vérifier si le SSO est activé
        if (!$this->isSsoEnabled()) {
            return $this->redirectToFrontend([
                'error' => 'sso_disabled',
                'message' => 'L\'authentification Google SSO est désactivée',
            ]);
        }

        // Vérifier si l'utilisateur a annulé
        if ($request->query->get('error') === 'access_denied') {
            return $this->redirectToFrontend([
                'error' => 'authentication_cancelled',
                'message' => 'Authentification annulée par l\'utilisateur',
            ]);
        }

        // Vérifier si le code OAuth est présent
        if (!$request->query->has('code')) {
            return $this->redirectToFrontend([
                'error' => 'missing_oauth_code',
                'message' => 'Paramètre de code OAuth manquant',
            ]);
        }

        // Vérifier si le state est présent (si activé)
        if ($this->isStateRequired() && !$request->query->has('state')) {
            return $this->redirectToFrontend([
                'error' => 'missing_oauth_state',
                'message' => 'Paramètre de state OAuth manquant',
            ]);
        }

        try {
            $client = $this->clientRegistry->getClient('google');

            // Récupérer les tokens Google
            $accessToken = $client->getAccessToken();

            // Récupérer les informations utilisateur depuis Google
            /** @var \League\OAuth2\Client\Provider\GoogleUser $googleUser */
            $googleUser = $client->fetchUserFromToken($accessToken);

            // Provisionner ou mettre à jour l'utilisateur
            $user = $this->userProvisioner->provisionUser(
                $googleUser->getId(),
                $googleUser->getEmail(),
                $googleUser->getName(),
                $googleUser->getAvatar(),
                $accessToken->getToken(),
                $accessToken->getRefreshToken()
            );

            // Générer les tokens JWT
            $jwtToken = $this->jwtManager->create($user);

            // SÉCURITÉ RENFORCÉE: Utiliser RefreshTokenService avec token hashing
            // - Génère un token aléatoire sécurisé (128 caractères)
            // - Hash SHA256 pour stockage en base
            // - Tracking IP et User-Agent pour sécurité
            $plaintextToken = bin2hex(random_bytes(64));
            $this->refreshTokenService->createToken(
                $user,
                $plaintextToken,
                (int) ($_ENV['JWT_REFRESH_TOKEN_TTL'] ?? 2592000), // 30 jours
                $request->getClientIp(),
                $request->headers->get('User-Agent', 'unknown')
            );

            // Rediriger vers le frontend avec les tokens
            return $this->redirectToFrontend([
                'access_token' => $jwtToken,
                'refresh_token' => $plaintextToken, // Return plaintext to client
                'token_type' => 'Bearer',
                'expires_in' => (string) ($_ENV['JWT_TOKEN_TTL'] ?? 3600),
            ]);
        } catch (\Exception $e) {
            // Log l'erreur pour le débogage
            error_log('Google OAuth Error: ' . $e->getMessage());
            error_log('Stack trace: ' . $e->getTraceAsString());

            return $this->redirectToFrontend([
                'error' => 'authentication_failed',
                'message' => 'Échec de l\'authentification avec Google: ' . $e->getMessage(),
            ]);
        }
    }

    private function isSsoEnabled(): bool
    {
        return filter_var(
            $_ENV['SSO_ENABLED'] ?? 'false',
            FILTER_VALIDATE_BOOLEAN
        );
    }

    private function isStateRequired(): bool
    {
        // Vérifier la configuration OAuth pour voir si use_state est activé
        // Par défaut, on utilise use_state=true pour la sécurité CSRF
        return true;
    }

    private function redirectToFrontend(array $params): RedirectResponse
    {
        // URL du frontend (à configurer via une variable d'environnement)
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:3000';
        $callbackUrl = $frontendUrl . '/auth/callback';

        // Construire l'URL avec les paramètres en hash fragments (plus sécurisé)
        $fragmentParams = http_build_query($params);

        $response = new RedirectResponse($callbackUrl . '#' . $fragmentParams);

        // 💡 tue le cookie du profiler
        $response->headers->clearCookie('sf_redirect', '/', null, true, true, 'lax');
        // (ajuste domaine/path si besoin)

        return $response;
    }
}
