<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use Symfony\Component\EventDispatcher\EventSubscriberInterface;
use Symfony\Component\HttpKernel\Event\ResponseEvent;
use Symfony\Component\HttpKernel\KernelEvents;

class SecurityHeadersSubscriber implements EventSubscriberInterface
{
    private const SENSITIVE_PATHS = [
        '/api/v1/auth',
        '/api/v1/user',
        '/api/v1/profile',
    ];

    public function __construct(
        private string $environment
    ) {
    }

    public static function getSubscribedEvents(): array
    {
        return [
            KernelEvents::RESPONSE => ['onKernelResponse', 0],
        ];
    }

    public function onKernelResponse(ResponseEvent $event): void
    {
        if (!$event->isMainRequest()) {
            return;
        }

        $response = $event->getResponse();
        $request = $event->getRequest();

        // En-têtes de sécurité standard
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // HSTS uniquement en production
        if ($this->environment === 'prod') {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // En-têtes de cache pour les endpoints sensibles
        if ($this->isSensitivePath($request->getPathInfo())) {
            $response->headers->set('Cache-Control', 'private, no-cache, no-store, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
        }

        // Content-Security-Policy pour les API
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'none'; frame-ancestors 'none'"
        );
    }

    private function isSensitivePath(string $path): bool
    {
        foreach (self::SENSITIVE_PATHS as $sensitivePath) {
            if (str_starts_with($path, $sensitivePath)) {
                return true;
            }
        }

        return false;
    }
}
