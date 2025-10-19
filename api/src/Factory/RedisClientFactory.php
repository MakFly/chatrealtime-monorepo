<?php

declare(strict_types=1);

namespace App\Factory;

use Predis\Client;

class RedisClientFactory
{
    public static function create(): Client
    {
        $redisUrl = $_ENV['REDIS_URL'] ?? 'redis://redis:6379';
        $redisPassword = $_ENV['REDIS_PASSWORD'] ?? null;

        $parameters = $redisUrl;
        $options = [];

        if ($redisPassword) {
            $options['parameters'] = ['password' => $redisPassword];
        }

        return new Client($parameters, $options);
    }
}
