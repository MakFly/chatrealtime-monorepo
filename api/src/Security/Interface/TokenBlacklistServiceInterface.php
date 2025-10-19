<?php

declare(strict_types=1);

namespace App\Security\Interface;

interface TokenBlacklistServiceInterface
{
    public function blacklistToken(string $token, int $ttl): void;

    public function isTokenBlacklisted(string $token): bool;

    public function blacklistAllUserTokens(string $userIdentifier): void;
}
