<?php

declare(strict_types=1);

namespace App\Tests\Feature\Auth;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

/**
 * Test que le JWT ne contient PAS les rôles (sécurité)
 * et que l'endpoint /api/v1/user/me retourne les données utilisateur avec rôles.
 */
class JWTPayloadTest extends ApiTestCase
{
    private EntityManagerInterface $entityManager;
    private UserPasswordHasherInterface $passwordHasher;

    protected function setUp(): void
    {
        parent::setUp();

        $container = static::getContainer();
        $this->entityManager = $container->get(EntityManagerInterface::class);
        $this->passwordHasher = $container->get(UserPasswordHasherInterface::class);

        // Nettoyer la base de données avant chaque test
        $this->cleanDatabase();
    }

    private function cleanDatabase(): void
    {
        $this->entityManager->createQuery('DELETE FROM App\Entity\User')->execute();
        $this->entityManager->flush();
    }

    /**
     * ✅ Test : Le JWT ne doit PAS contenir le claim "roles"
     */
    public function test_jwt_does_not_contain_roles(): void
    {
        // Créer un utilisateur avec rôle ADMIN
        $user = new User();
        $user->setEmail('admin@example.com');
        $user->setPassword($this->passwordHasher->hashPassword($user, 'Admin123!'));
        $user->setRoles(['ROLE_ADMIN', 'ROLE_USER']);
        $user->setName('Admin User');

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        // S'authentifier et récupérer le JWT
        $response = static::createClient()->request('POST', '/api/v1/auth/login', [
            'json' => [
                'email' => 'admin@example.com',
                'password' => 'Admin123!',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Vérifier que le token existe
        $this->assertArrayHasKey('access_token', $data);
        $accessToken = $data['access_token'];

        // Décoder le JWT (sans vérification de signature pour inspecter le payload)
        $parts = explode('.', $accessToken);
        $this->assertCount(3, $parts, 'JWT doit avoir 3 parties (header.payload.signature)');

        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);

        // ❌ CRITÈRE PRINCIPAL : Le JWT ne doit PAS contenir les rôles
        $this->assertArrayNotHasKey('roles', $payload, 'Le JWT ne doit PAS contenir le claim "roles"');

        // ✅ Le JWT doit contenir les claims standards (RFC 7519)
        $this->assertArrayHasKey('iss', $payload, 'JWT doit contenir "iss" (issuer)');
        $this->assertArrayHasKey('aud', $payload, 'JWT doit contenir "aud" (audience)');
        $this->assertArrayHasKey('sub', $payload, 'JWT doit contenir "sub" (subject/user ID)');
        $this->assertArrayHasKey('jti', $payload, 'JWT doit contenir "jti" (JWT ID unique)');
        $this->assertArrayHasKey('email', $payload, 'JWT doit contenir "email"');
        $this->assertArrayHasKey('device_id', $payload, 'JWT doit contenir "device_id" (anti-theft)');

        // ✅ Vérifier les valeurs des claims
        $this->assertSame('chat-realtime-api', $payload['iss']);
        $this->assertSame('chat-realtime-app', $payload['aud']);
        $this->assertSame('admin@example.com', $payload['email']);
        $this->assertSame((string) $user->getId(), $payload['sub']);

        // ❌ Le JWT ne doit PAS contenir "username" (duplication avec email)
        $this->assertArrayNotHasKey('username', $payload, 'Le JWT ne doit PAS contenir "username"');
    }

    /**
     * ✅ Test : L'endpoint /api/v1/user/me retourne les rôles
     */
    public function test_user_me_endpoint_returns_roles(): void
    {
        // Créer un utilisateur avec rôle ADMIN
        $user = new User();
        $user->setEmail('user@example.com');
        $user->setPassword($this->passwordHasher->hashPassword($user, 'User123!'));
        $user->setRoles(['ROLE_ADMIN', 'ROLE_USER']);
        $user->setName('Test User');

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        // S'authentifier
        $loginResponse = static::createClient()->request('POST', '/api/v1/auth/login', [
            'json' => [
                'email' => 'user@example.com',
                'password' => 'User123!',
            ],
        ]);

        $loginData = $loginResponse->toArray();
        $accessToken = $loginData['access_token'];

        // Appeler l'endpoint /api/v1/user/me
        $meResponse = static::createClient()->request('GET', '/api/v1/user/me', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $meData = $meResponse->toArray();

        // ✅ L'endpoint doit retourner les rôles
        $this->assertArrayHasKey('roles', $meData, '/api/v1/user/me doit retourner les rôles');
        $this->assertIsArray($meData['roles']);
        $this->assertContains('ROLE_ADMIN', $meData['roles']);
        $this->assertContains('ROLE_USER', $meData['roles']);

        // ✅ L'endpoint doit retourner les autres informations
        $this->assertArrayHasKey('id', $meData);
        $this->assertArrayHasKey('email', $meData);
        $this->assertArrayHasKey('name', $meData);
        $this->assertArrayHasKey('picture', $meData);
        $this->assertArrayHasKey('created_at', $meData);
        $this->assertArrayHasKey('has_google_account', $meData);

        $this->assertSame('user@example.com', $meData['email']);
        $this->assertSame('Test User', $meData['name']);
        $this->assertFalse($meData['has_google_account']);
    }

    /**
     * ✅ Test : JWT avec device_id invalide doit être rejeté
     */
    public function test_jwt_with_invalid_device_id_is_rejected(): void
    {
        // Créer un utilisateur
        $user = new User();
        $user->setEmail('test@example.com');
        $user->setPassword($this->passwordHasher->hashPassword($user, 'Test123!'));
        $user->setName('Test User');

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        // S'authentifier avec un User-Agent spécifique
        $client = static::createClient();
        $loginResponse = $client->request('POST', '/api/v1/auth/login', [
            'headers' => [
                'User-Agent' => 'Mozilla/5.0 (Original Device)',
            ],
            'json' => [
                'email' => 'test@example.com',
                'password' => 'Test123!',
            ],
        ]);

        $loginData = $loginResponse->toArray();
        $accessToken = $loginData['access_token'];

        // Essayer d'utiliser le token avec un User-Agent différent (simulation de vol de token)
        $meResponse = $client->request('GET', '/api/v1/user/me', [
            'headers' => [
                'Authorization' => 'Bearer ' . $accessToken,
                'User-Agent' => 'Mozilla/5.0 (DIFFERENT Device - Stolen Token)',
            ],
        ]);

        // ✅ Le token doit être rejeté (401 Unauthorized)
        $this->assertResponseStatusCodeSame(401, 'Token volé doit être rejeté');
    }

    protected function tearDown(): void
    {
        $this->cleanDatabase();
        parent::tearDown();
    }
}
