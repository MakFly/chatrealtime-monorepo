<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Security\Interface\SecurityMonitoringServiceInterface;
use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ControllerEvent;
use Symfony\Component\HttpKernel\KernelEvents;
use Symfony\Component\RateLimiter\RateLimiterFactory;

class RateLimitSubscriber implements EventSubscriberInterface
{
    // Rate limit configuration (mirrors config/packages/rate_limiter.yaml)
    private const RATE_LIMITS = [
        'auth.login' => 5,
        'auth.register' => 3,
        'auth.refresh' => 10,
        'auth.logout' => 20,
    ];

    public function __construct(
        private RateLimiterFactory $authLoginLimiter,
        private RateLimiterFactory $authRegisterLimiter,
        private RateLimiterFactory $authRefreshLimiter,
        private RateLimiterFactory $authLogoutLimiter,
        private SecurityMonitoringServiceInterface $securityMonitoring
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::CONTROLLER => ['onKernelController', 10],
        ];
    }

    public function onKernelController(ControllerEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $request = $event->getRequest();
        $path = $request->getPathInfo();
        $method = $request->getMethod();

        // Appliquer le rate limiting uniquement aux endpoints d'authentification
        $limiter = null;
        $identifier = $this->getIdentifier($request, $path);
        $endpointName = '';

        if ($path === '/api/v1/auth/login' && $method === 'POST') {
            $limiter = $this->authLoginLimiter;
            $endpointName = 'auth.login';
        } elseif ($path === '/api/v1/auth/register' && $method === 'POST') {
            $limiter = $this->authRegisterLimiter;
            $endpointName = 'auth.register';
        } elseif ($path === '/api/v1/auth/refresh' && $method === 'POST') {
            $limiter = $this->authRefreshLimiter;
            $endpointName = 'auth.refresh';
        } elseif ($path === '/api/v1/auth/logout' && $method === 'POST') {
            $limiter = $this->authLogoutLimiter;
            $endpointName = 'auth.logout';
        }

        if ($limiter === null) {
            return;
        }

        $limit = $limiter->create($identifier);

        $rateLimit = $limit->consume(1);

        if (!$rateLimit->isAccepted()) {
            $this->securityMonitoring->logRateLimitViolation($endpointName, $identifier);

            $response = new JsonResponse([
                'error' => 'rate_limit_exceeded',
                'message' => 'Trop de tentatives. Veuillez réessayer plus tard.',
                'retry_after' => $rateLimit->getRetryAfter()->getTimestamp(),
            ], Response::HTTP_TOO_MANY_REQUESTS);

            $response->headers->set('X-RateLimit-Limit', (string) self::RATE_LIMITS[$endpointName]);
            $response->headers->set('X-RateLimit-Remaining', '0');
            $response->headers->set('X-RateLimit-Reset', (string) $rateLimit->getRetryAfter()->getTimestamp());
            $response->headers->set('Retry-After', (string) $rateLimit->getRetryAfter()->getTimestamp());

            $event->setController(function () use ($response) {
                return $response;
            });
        } else {
            // Ajouter les headers de rate limit aux réponses réussies
            $request->attributes->set('rate_limit', [
                'limit' => self::RATE_LIMITS[$endpointName],
                'remaining' => $rateLimit->getRemainingTokens(),
                'reset' => $rateLimit->getRetryAfter()->getTimestamp(),
            ]);
        }
    }

    private function getIdentifier($request, string $path): string
    {
        // Pour le refresh, utiliser l'email si disponible
        if (str_contains($path, 'refresh')) {
            $data = json_decode($request->getContent(), true);
            if (isset($data['refresh_token'])) {
                // Utiliser un hash du refresh token comme identifiant
                return 'user:' . hash('sha256', $data['refresh_token']);
            }
        }

        // Par défaut, utiliser l'adresse IP
        return 'ip:' . $request->getClientIp();
    }
}
