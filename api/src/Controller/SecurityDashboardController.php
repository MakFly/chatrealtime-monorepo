<?php

declare(strict_types=1);

namespace App\Controller;

use Predis\Client as RedisClient;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/security')]
class SecurityDashboardController extends AbstractController
{
    public function __construct(
        private RedisClient $redisClient,
        private LoggerInterface $logger
    ) {
    }

    #[Route('/dashboard', name: 'security_dashboard', methods: ['GET'])]
    public function dashboard(): Response
    {
        // Collecter les métriques de sécurité
        $metrics = [
            'failed_logins' => $this->getFailedLoginsCount(),
            'rate_limit_violations' => $this->getRateLimitViolationsCount(),
            'blacklisted_tokens' => $this->getBlacklistedTokensCount(),
            'active_sessions' => $this->getActiveSessionsCount(),
            'suspicious_activities' => $this->getSuspiciousActivitiesCount(),
        ];

        // Récupérer les événements récents
        $recentEvents = $this->getRecentSecurityEvents();

        // Récupérer les statistiques de rate limiting
        $rateLimitStats = $this->getRateLimitStatistics();

        return $this->render('security/dashboard.html.twig', [
            'metrics' => $metrics,
            'recentEvents' => $recentEvents,
            'rateLimitStats' => $rateLimitStats,
            'updated_at' => new \DateTimeImmutable(),
        ]);
    }

    private function getFailedLoginsCount(): int
    {
        try {
            $keys = $this->redisClient->keys('security:failed_login:*');
            return count($keys);
        } catch (\Exception $e) {
            $this->logger->error('Failed to get failed logins count', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    private function getRateLimitViolationsCount(): int
    {
        try {
            $keys = $this->redisClient->keys('security:rate_limit_violation:*');
            $total = 0;
            foreach ($keys as $key) {
                $total += (int) $this->redisClient->get($key);
            }
            return $total;
        } catch (\Exception $e) {
            $this->logger->error('Failed to get rate limit violations count', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    private function getBlacklistedTokensCount(): int
    {
        try {
            $keys = $this->redisClient->keys('blacklist:token:*');
            return count($keys);
        } catch (\Exception $e) {
            $this->logger->error('Failed to get blacklisted tokens count', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    private function getActiveSessionsCount(): int
    {
        try {
            $keys = $this->redisClient->keys('security:token_refresh:*');
            return count($keys);
        } catch (\Exception $e) {
            $this->logger->error('Failed to get active sessions count', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    private function getSuspiciousActivitiesCount(): int
    {
        try {
            $keys = $this->redisClient->keys('security:suspicious:*');
            return count($keys);
        } catch (\Exception $e) {
            $this->logger->error('Failed to get suspicious activities count', ['error' => $e->getMessage()]);
            return 0;
        }
    }

    private function getRecentSecurityEvents(): array
    {
        // Simuler des événements récents (à remplacer par une vraie implémentation)
        return [
            [
                'type' => 'failed_login',
                'description' => 'Tentative de connexion échouée',
                'ip' => '192.168.1.100',
                'timestamp' => new \DateTimeImmutable('-5 minutes'),
                'severity' => 'warning',
            ],
            [
                'type' => 'rate_limit',
                'description' => 'Dépassement de limite de taux',
                'ip' => '10.0.0.50',
                'timestamp' => new \DateTimeImmutable('-15 minutes'),
                'severity' => 'info',
            ],
            [
                'type' => 'suspicious_activity',
                'description' => 'Activité suspecte détectée',
                'ip' => '172.16.0.10',
                'timestamp' => new \DateTimeImmutable('-30 minutes'),
                'severity' => 'danger',
            ],
        ];
    }

    private function getRateLimitStatistics(): array
    {
        return [
            'login' => ['limit' => 5, 'window' => '1 minute'],
            'register' => ['limit' => 3, 'window' => '1 minute'],
            'refresh' => ['limit' => 10, 'window' => '1 minute'],
            'logout' => ['limit' => 20, 'window' => '1 minute'],
        ];
    }
}
