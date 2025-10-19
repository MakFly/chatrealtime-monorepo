<?php

declare(strict_types=1);

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTDecodedEvent;
use Symfony\Component\HttpFoundation\RequestStack;
use Psr\Log\LoggerInterface;

/**
 * Valide le payload JWT pour s'assurer qu'il respecte les standards
 * et détecte les tokens potentiellement volés.
 */
class JWTDecodedListener
{
    private const MODE_STRICT = 'strict';
    private const MODE_RELAXED = 'relaxed';
    private const MODE_DISABLED = 'disabled';

    private array $bypassPatterns;

    public function __construct(
        private RequestStack $requestStack,
        private LoggerInterface $logger,
        private string $fingerprintMode = self::MODE_STRICT,
        string $bypassPatternsString = ''
    ) {
        $this->bypassPatterns = $bypassPatternsString
            ? array_filter(array_map('trim', explode(',', $bypassPatternsString)))
            : [];
    }

    public function onJWTDecoded(JWTDecodedEvent $event): void
    {
        $request = $this->requestStack->getCurrentRequest();
        $payload = $event->getPayload();

        // ✅ Vérifier l'audience (pour qui le token est destiné)
        // RFC 7519: aud can be a string or an array of strings
        $audience = $payload['aud'] ?? null;
        $expectedAudience = 'chat-realtime-app';

        if ($audience === null) {
            $this->logger->warning('JWT rejected: missing audience', [
                'aud' => 'missing',
            ]);
            $event->markAsInvalid();
            return;
        }

        // Handle both string and array formats
        $isValidAudience = is_array($audience)
            ? in_array($expectedAudience, $audience, true)
            : $audience === $expectedAudience;

        if (!$isValidAudience) {
            $this->logger->warning('JWT rejected: invalid audience', [
                'aud' => $audience,
                'expected' => $expectedAudience,
            ]);
            $event->markAsInvalid();
            return;
        }

        // ✅ Vérifier l'issuer (qui a créé le token)
        if (!isset($payload['iss']) || $payload['iss'] !== 'chat-realtime-api') {
            $this->logger->warning('JWT rejected: invalid issuer', [
                'iss' => $payload['iss'] ?? 'missing',
            ]);
            $event->markAsInvalid();
            return;
        }

        // ✅ Vérifier le subject (user ID présent)
        if (!isset($payload['sub']) || empty($payload['sub'])) {
            $this->logger->warning('JWT rejected: missing subject');
            $event->markAsInvalid();
            return;
        }

        // ✅ Vérifier le device fingerprint (anti-theft) - ENVIRONMENT AWARE
        if ($request && isset($payload['device_id'])) {
            $this->validateDeviceFingerprint($event, $request, $payload);
        }

        // Note: La vérification du blacklist est gérée par un autre listener
        // via TokenBlacklistService si nécessaire
    }

    private function validateDeviceFingerprint(
        JWTDecodedEvent $event,
        \Symfony\Component\HttpFoundation\Request $request,
        array $payload
    ): void {
        // Skip validation if disabled
        if ($this->fingerprintMode === self::MODE_DISABLED) {
            $this->logger->debug('Device fingerprint validation disabled');
            return;
        }

        $userAgent = $request->headers->get('User-Agent', 'unknown');
        $currentDeviceId = hash('sha256', $userAgent);

        // Check if User-Agent is bypassed (development only)
        if ($this->isBypassedUserAgent($userAgent)) {
            $this->logger->info('Device fingerprint bypassed for User-Agent', [
                'user_agent' => $userAgent,
                'user_id' => $payload['sub'] ?? 'unknown',
                'mode' => $this->fingerprintMode,
            ]);
            return;
        }

        // Validate device fingerprint
        if ($payload['device_id'] !== $currentDeviceId) {
            $contextData = [
                'expected' => $payload['device_id'],
                'actual' => $currentDeviceId,
                'user_id' => $payload['sub'] ?? 'unknown',
                'user_agent' => $userAgent,
                'mode' => $this->fingerprintMode,
            ];

            if ($this->fingerprintMode === self::MODE_STRICT) {
                // PRODUCTION: Reject the token
                $this->logger->alert(
                    'JWT rejected: device fingerprint mismatch (potential token theft)',
                    $contextData
                );
                $event->markAsInvalid();
            } else {
                // DEVELOPMENT/RELAXED: Log warning but allow
                $this->logger->warning(
                    'Device fingerprint mismatch detected (allowed in relaxed mode)',
                    $contextData
                );
            }
        }
    }

    private function isBypassedUserAgent(string $userAgent): bool
    {
        if (empty($this->bypassPatterns)) {
            return false;
        }

        $userAgentLower = strtolower($userAgent);
        foreach ($this->bypassPatterns as $pattern) {
            if (str_contains($userAgentLower, strtolower($pattern))) {
                return true;
            }
        }

        return false;
    }
}
