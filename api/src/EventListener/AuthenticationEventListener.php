<?php

declare(strict_types=1);

namespace App\EventListener;

use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationFailureEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\AuthenticationSuccessEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTCreatedEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTExpiredEvent;
use Lexik\Bundle\JWTAuthenticationBundle\Event\JWTInvalidEvent;
use Psr\Log\LoggerInterface;
use Symfony\Component\EventDispatcher\Attribute\AsEventListener;
use Symfony\Component\HttpFoundation\RequestStack;

#[AsEventListener(event: 'lexik_jwt_authentication.on_authentication_success')]
#[AsEventListener(event: 'lexik_jwt_authentication.on_authentication_failure')]
#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_created')]
#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_expired')]
#[AsEventListener(event: 'lexik_jwt_authentication.on_jwt_invalid')]
class AuthenticationEventListener
{
    public function __construct(
        private LoggerInterface $logger,
        private RequestStack $requestStack,
    ) {
    }

    public function __invoke(
        AuthenticationSuccessEvent|AuthenticationFailureEvent|JWTCreatedEvent|JWTExpiredEvent|JWTInvalidEvent $event
    ): void {
        $request = $this->requestStack->getCurrentRequest();
        $ipAddress = $request?->getClientIp() ?? 'unknown';
        $userAgent = $request?->headers->get('User-Agent') ?? 'unknown';

        match (true) {
            $event instanceof AuthenticationSuccessEvent => $this->logSuccess($event, $ipAddress, $userAgent),
            $event instanceof AuthenticationFailureEvent => $this->logFailure($event, $ipAddress, $userAgent),
            $event instanceof JWTCreatedEvent => $this->logTokenCreated($event, $ipAddress, $userAgent),
            $event instanceof JWTExpiredEvent => $this->logTokenExpired($ipAddress, $userAgent),
            $event instanceof JWTInvalidEvent => $this->logTokenInvalid($ipAddress, $userAgent),
            default => null,
        };
    }

    private function logSuccess(AuthenticationSuccessEvent $event, string $ipAddress, string $userAgent): void
    {
        $user = $event->getUser();

        $this->logger->info('Authentication successful', [
            'event' => 'auth.success',
            'user_identifier' => $user?->getUserIdentifier() ?? 'unknown',
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    private function logFailure(AuthenticationFailureEvent $event, string $ipAddress, string $userAgent): void
    {
        $exception = $event->getException();

        $this->logger->warning('Authentication failed', [
            'event' => 'auth.failure',
            'reason' => $exception?->getMessage() ?? 'unknown',
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    private function logTokenCreated(JWTCreatedEvent $event, string $ipAddress, string $userAgent): void
    {
        $payload = $event->getData();
        $user = $event->getUser();

        $this->logger->info('JWT token created', [
            'event' => 'jwt.created',
            'user_identifier' => $user?->getUserIdentifier() ?? $payload['username'] ?? 'unknown',
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'expires_at' => isset($payload['exp']) ? date('c', $payload['exp']) : 'unknown',
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    private function logTokenExpired(string $ipAddress, string $userAgent): void
    {
        $this->logger->notice('JWT token expired', [
            'event' => 'jwt.expired',
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ]);
    }

    private function logTokenInvalid(string $ipAddress, string $userAgent): void
    {
        $this->logger->warning('JWT token invalid', [
            'event' => 'jwt.invalid',
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ]);
    }
}
