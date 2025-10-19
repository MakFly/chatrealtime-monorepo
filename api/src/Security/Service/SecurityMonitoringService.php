<?php

declare(strict_types=1);

namespace App\Security\Service;

use App\Security\Interface\SecurityMonitoringServiceInterface;
use Predis\Client as RedisClient;
use Psr\Log\LoggerInterface;

class SecurityMonitoringService implements SecurityMonitoringServiceInterface
{
    private const FAILED_LOGIN_WINDOW = 300; // 5 minutes
    private const FAILED_LOGIN_THRESHOLD = 5;
    private const SUSPICIOUS_ACTIVITY_THRESHOLD = 10;

    public function __construct(
        private RedisClient $redisClient,
        private LoggerInterface $logger
    ) {
    }

    public function logFailedLogin(string $email, string $ipAddress, string $userAgent): void
    {
        $this->logger->warning('Failed login attempt', [
            'event_type' => 'auth.failed_login',
            'email' => $email,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'timestamp' => time(),
            'risk_score' => $this->calculateRiskScore($ipAddress, $email),
        ]);

        // Incrémenter le compteur de tentatives échouées
        $key = "security:failed_login:{$ipAddress}";
        $this->redisClient->incr($key);
        $this->redisClient->expire($key, self::FAILED_LOGIN_WINDOW);

        $this->checkForSuspiciousPatterns($ipAddress, $email);
    }

    public function logSuccessfulLogin(string $email, string $ipAddress, string $userAgent): void
    {
        $this->logger->info('Successful login', [
            'event_type' => 'auth.successful_login',
            'email' => $email,
            'ip_address' => $ipAddress,
            'user_agent' => $userAgent,
            'timestamp' => time(),
        ]);

        // Réinitialiser le compteur de tentatives échouées
        $key = "security:failed_login:{$ipAddress}";
        $this->redisClient->del($key);
    }

    public function logTokenRefresh(string $userIdentifier, string $ipAddress): void
    {
        $this->logger->info('Token refresh', [
            'event_type' => 'auth.token_refresh',
            'user_identifier' => $userIdentifier,
            'ip_address' => $ipAddress,
            'timestamp' => time(),
        ]);

        // Surveiller les rafraîchissements de tokens suspects
        $key = "security:token_refresh:{$userIdentifier}";
        $this->redisClient->incr($key);
        $this->redisClient->expire($key, 60); // 1 minute window

        $count = (int) $this->redisClient->get($key);
        if ($count > 10) {
            $this->logger->warning('Suspicious token refresh activity', [
                'user_identifier' => $userIdentifier,
                'ip_address' => $ipAddress,
                'refresh_count' => $count,
            ]);
        }
    }

    public function logLogout(string $userIdentifier, string $ipAddress): void
    {
        $this->logger->info('User logout', [
            'event_type' => 'auth.logout',
            'user_identifier' => $userIdentifier,
            'ip_address' => $ipAddress,
            'timestamp' => time(),
        ]);
    }

    public function detectSuspiciousActivity(string $identifier, string $eventType): bool
    {
        $key = "security:suspicious:{$eventType}:{$identifier}";
        $count = (int) $this->redisClient->get($key);

        if ($count >= self::SUSPICIOUS_ACTIVITY_THRESHOLD) {
            $this->logger->alert('Suspicious activity detected', [
                'identifier' => $identifier,
                'event_type' => $eventType,
                'count' => $count,
                'threshold' => self::SUSPICIOUS_ACTIVITY_THRESHOLD,
            ]);

            return true;
        }

        return false;
    }

    public function logRateLimitViolation(string $endpoint, string $identifier): void
    {
        $this->logger->warning('Rate limit violation', [
            'event_type' => 'security.rate_limit_violation',
            'endpoint' => $endpoint,
            'identifier' => $identifier,
            'timestamp' => time(),
        ]);

        // Enregistrer la violation pour détecter les patterns
        $key = "security:rate_limit_violation:{$identifier}";
        $this->redisClient->incr($key);
        $this->redisClient->expire($key, 3600); // 1 hour window
    }

    private function calculateRiskScore(string $ipAddress, string $email): int
    {
        $score = 0;

        // Vérifier les tentatives échouées précédentes
        $failedKey = "security:failed_login:{$ipAddress}";
        $failedCount = (int) $this->redisClient->get($failedKey);
        $score += $failedCount * 10;

        // Vérifier les violations de rate limit
        $rateLimitKey = "security:rate_limit_violation:{$ipAddress}";
        $rateLimitCount = (int) $this->redisClient->get($rateLimitKey);
        $score += $rateLimitCount * 20;

        return min($score, 100);
    }

    private function checkForSuspiciousPatterns(string $ipAddress, string $email): void
    {
        // Vérifier le nombre de tentatives échouées
        $key = "security:failed_login:{$ipAddress}";
        $count = (int) $this->redisClient->get($key);

        if ($count >= self::FAILED_LOGIN_THRESHOLD) {
            $this->logger->alert('Multiple failed login attempts detected', [
                'ip_address' => $ipAddress,
                'email' => $email,
                'attempts' => $count,
                'threshold' => self::FAILED_LOGIN_THRESHOLD,
                'window_seconds' => self::FAILED_LOGIN_WINDOW,
            ]);
        }

        // Vérifier si plusieurs IPs tentent de se connecter au même compte
        $emailKey = "security:failed_login_email:{$email}";
        $this->redisClient->sadd($emailKey, $ipAddress);
        $this->redisClient->expire($emailKey, self::FAILED_LOGIN_WINDOW);

        $uniqueIps = $this->redisClient->scard($emailKey);
        if ($uniqueIps >= 3) {
            $this->logger->alert('Multiple IPs attempting login for same account', [
                'email' => $email,
                'unique_ips' => $uniqueIps,
                'current_ip' => $ipAddress,
            ]);
        }
    }
}
