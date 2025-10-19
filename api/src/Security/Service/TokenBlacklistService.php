<?php

declare(strict_types=1);

namespace App\Security\Service;

use App\Security\Interface\TokenBlacklistServiceInterface;
use Predis\Client as RedisClient;
use Psr\Log\LoggerInterface;

class TokenBlacklistService implements TokenBlacklistServiceInterface
{
    public function __construct(
        private RedisClient $redisClient,
        private LoggerInterface $logger
    ) {
    }

    public function blacklistToken(string $token, int $ttl): void
    {
        try {
            $key = $this->getBlacklistKey($token);
            $this->redisClient->setex(
                $key,
                $ttl,
                json_encode([
                    'revoked_at' => time(),
                    'token_hash' => hash('sha256', $token),
                ], JSON_THROW_ON_ERROR)
            );

            $this->logger->info('Token blacklisted successfully', [
                'token_hash' => hash('sha256', $token),
                'ttl' => $ttl,
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Failed to blacklist token', [
                'error' => $e->getMessage(),
                'token_hash' => hash('sha256', $token),
            ]);
            throw $e;
        }
    }

    public function isTokenBlacklisted(string $token): bool
    {
        try {
            $key = $this->getBlacklistKey($token);
            return $this->redisClient->exists($key) === 1;
        } catch (\Exception $e) {
            $this->logger->error('Failed to check token blacklist status', [
                'error' => $e->getMessage(),
                'token_hash' => hash('sha256', $token),
            ]);
            // En cas d'erreur Redis, on considère le token comme non blacklisté pour ne pas bloquer l'authentification
            return false;
        }
    }

    public function blacklistAllUserTokens(string $userIdentifier): void
    {
        try {
            $pattern = "blacklist:user:{$userIdentifier}:*";
            $keys = $this->redisClient->keys($pattern);

            foreach ($keys as $key) {
                $this->redisClient->del($key);
            }

            $this->logger->warning('All user tokens blacklisted', [
                'user_identifier' => $userIdentifier,
                'tokens_count' => count($keys),
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Failed to blacklist all user tokens', [
                'error' => $e->getMessage(),
                'user_identifier' => $userIdentifier,
            ]);
            throw $e;
        }
    }

    private function getBlacklistKey(string $token): string
    {
        return 'blacklist:token:' . hash('sha256', $token);
    }
}
