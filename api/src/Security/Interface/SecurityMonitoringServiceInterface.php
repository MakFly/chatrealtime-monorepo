<?php

declare(strict_types=1);

namespace App\Security\Interface;

interface SecurityMonitoringServiceInterface
{
    public function logFailedLogin(string $email, string $ipAddress, string $userAgent): void;

    public function logSuccessfulLogin(string $email, string $ipAddress, string $userAgent): void;

    public function logTokenRefresh(string $userIdentifier, string $ipAddress): void;

    public function logLogout(string $userIdentifier, string $ipAddress): void;

    public function detectSuspiciousActivity(string $identifier, string $eventType): bool;

    public function logRateLimitViolation(string $endpoint, string $identifier): void;
}
