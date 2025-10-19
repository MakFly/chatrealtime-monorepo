<?php

declare(strict_types=1);

namespace App\Tests\Feature\Auth;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class RateLimitTest extends WebTestCase
{
    public function testLoginRateLimitEnforcement(): void
    {
        $client = static::createClient();

        // Effectuer 6 tentatives de connexion (limite: 5 par minute)
        for ($i = 0; $i < 6; $i++) {
            $client->request('POST', '/api/v1/auth/login', [], [], [
                'CONTENT_TYPE' => 'application/json',
            ], json_encode([
                'email' => 'nonexistent@example.com',
                'password' => 'WrongPassword123!',
            ]));

            if ($i < 5) {
                // Les 5 premières tentatives devraient échouer avec 401 (unauthorized)
                $this->assertResponseStatusCodeSame(401);
            } else {
                // La 6ème tentative devrait être bloquée par rate limiting (429)
                $this->assertResponseStatusCodeSame(429);

                // Vérifier la présence des headers de rate limit
                $this->assertTrue($client->getResponse()->headers->has('X-RateLimit-Limit'));
                $this->assertTrue($client->getResponse()->headers->has('X-RateLimit-Remaining'));
                $this->assertTrue($client->getResponse()->headers->has('Retry-After'));
            }
        }
    }

    public function testRegisterRateLimitEnforcement(): void
    {
        $client = static::createClient();

        // Effectuer 4 tentatives d'inscription (limite: 3 par minute)
        for ($i = 0; $i < 4; $i++) {
            $client->request('POST', '/api/v1/auth/register', [], [], [
                'CONTENT_TYPE' => 'application/json',
            ], json_encode([
                'email' => "test{$i}@example.com",
                'password' => 'StrongP@ss123',
            ]));

            if ($i < 3) {
                // Les 3 premières tentatives devraient réussir ou échouer normalement
                $this->assertNotEquals(429, $client->getResponse()->getStatusCode());
            } else {
                // La 4ème tentative devrait être bloquée par rate limiting (429)
                $this->assertResponseStatusCodeSame(429);
            }
        }
    }
}
