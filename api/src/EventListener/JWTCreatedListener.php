<?php

declare(strict_types=1);

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Personnalise le payload JWT pour inclure uniquement les claims standards
 * et retirer les données sensibles ou volumineuses (comme les rôles).
 *
 * Les rôles doivent être récupérés via l'endpoint /api/v1/user/me
 */
class JWTCreatedListener
{
    public function __construct(
        private RequestStack $requestStack
    ) {
    }

    public function onJWTCreated(JWTCreatedEvent $event): void
    {
        $request = $this->requestStack->getCurrentRequest();
        $user = $event->getUser();
        $payload = $event->getData();

        // ✅ Claims standards (RFC 7519)
        $payload['iss'] = 'chat-realtime-api';           // Issuer
        $payload['aud'] = 'chat-realtime-app';           // Audience
        $payload['jti'] = bin2hex(random_bytes(16));     // JWT ID unique
        $payload['sub'] = (string) $user->getId();       // Subject (User ID)

        // ✅ Garder uniquement l'email
        $payload['email'] = $user->getEmail();

        // ❌ RETIRER les rôles du JWT
        // Les rôles seront récupérés via /api/v1/user/me
        unset($payload['roles']);

        // ❌ RETIRER le username (duplication avec email)
        unset($payload['username']);

        // ✅ Device fingerprinting pour sécurité (détection vol de token)
        if ($request) {
            $userAgent = $request->headers->get('User-Agent', 'unknown');
            $payload['device_id'] = hash('sha256', $userAgent);

            // Optionnel: IP pour détection de vol (attention mobile/VPN)
            // $payload['ip'] = $request->getClientIp();
        }

        $event->setData($payload);
    }
}
