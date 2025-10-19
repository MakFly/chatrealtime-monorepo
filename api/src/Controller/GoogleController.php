<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\GoogleUserProvisioner;
use KnpU\OAuth2ClientBundle\Client\ClientRegistry;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Gesdinet\JWTRefreshTokenBundle\Generator\RefreshTokenGeneratorInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
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
        private RefreshTokenGeneratorInterface $refreshTokenGenerator,
        private RefreshTokenManagerInterface $refreshTokenManager,
    ) {
    }

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
            $refreshToken = $this->refreshTokenGenerator->createForUserWithTtl(
                $user,
                (int) ($_ENV['JWT_REFRESH_TOKEN_TTL'] ?? 2592000)
            );
            $this->refreshTokenManager->save($refreshToken);

            // Rediriger vers le frontend avec les tokens
            return $this->redirectToFrontend([
                'access_token' => $jwtToken,
                'refresh_token' => $refreshToken->getRefreshToken(),
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

    private function redirectToFrontend(array $params): RedirectResponse
    {
        // URL du frontend (à configurer via une variable d'environnement)
        $frontendUrl = $_ENV['FRONTEND_URL'] ?? 'http://localhost:3000';
        $callbackUrl = $frontendUrl . '/auth/callback';

        // Construire l'URL avec les paramètres en hash fragments (plus sécurisé)
        $fragmentParams = http_build_query($params);

        return new RedirectResponse($callbackUrl . '#' . $fragmentParams);
    }
}
