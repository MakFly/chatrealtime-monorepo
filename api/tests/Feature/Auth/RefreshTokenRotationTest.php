<?php

declare(strict_types=1);

namespace App\Tests\Feature\Auth;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class RefreshTokenRotationTest extends WebTestCase
{
    public function testRefreshTokenRotationOnRefresh(): void
    {
        $client = static::createClient();

        // 1. Créer un utilisateur et obtenir les tokens
        $client->request('POST', '/api/v1/auth/register', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'email' => 'test.rotation@example.com',
            'password' => 'StrongP@ss123',
        ]));

        $this->assertResponseIsSuccessful();
        $response = json_decode($client->getResponse()->getContent(), true);
        $initialRefreshToken = $response['refresh_token'];

        // 2. Utiliser le refresh token pour obtenir un nouveau token
        $client->request('POST', '/api/v1/auth/refresh', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'refresh_token' => $initialRefreshToken,
        ]));

        $this->assertResponseIsSuccessful();
        $response = json_decode($client->getResponse()->getContent(), true);
        $newRefreshToken = $response['refresh_token'];

        // 3. Vérifier que le nouveau refresh token est différent
        $this->assertNotEquals($initialRefreshToken, $newRefreshToken);

        // 4. Vérifier que l'ancien refresh token ne fonctionne plus
        $client->request('POST', '/api/v1/auth/refresh', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode([
            'refresh_token' => $initialRefreshToken,
        ]));

        $this->assertResponseStatusCodeSame(401);
    }
}
