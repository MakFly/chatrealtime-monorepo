<?php

declare(strict_types=1);

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

it('returns JWT when credentials are valid', function () {
    // Créer un utilisateur de test via le container
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    $user = createUser([
        'email' => 'logintest@example.com',
        'password' => 'password123',
    ]);
    $em->persist($user);
    $em->flush();

    // Faire la requête de login
    postJson('/api/v1/auth/login', [
        'email' => 'logintest@example.com',
        'password' => 'password123',
    ]);

    // Vérifications
    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(200);

    $data = json_decode($response->getContent(), true);
    expect($data)->toHaveKeys(['access_token', 'refresh_token', 'token_type', 'expires_in', 'user']);
    expect($data['access_token'])->toBeValidJwt();
    expect($data['token_type'])->toBe('Bearer');
    expect($data['expires_in'])->toBe(3600);
    expect($data['user']['email'])->toBe('logintest@example.com');

    // Cleanup
    $em->remove($user);
    $em->flush();
});

it('returns 401 when password is incorrect', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    $user = createUser([
        'email' => 'wrongpass@example.com',
        'password' => 'correctpassword',
    ]);
    $em->persist($user);
    $em->flush();

    postJson('/api/v1/auth/login', [
        'email' => 'wrongpass@example.com',
        'password' => 'wrongpassword',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(401);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_credentials');

    // Cleanup
    $em->remove($user);
    $em->flush();
});

it('returns 401 when email does not exist', function () {
    postJson('/api/v1/auth/login', [
        'email' => 'notfound@example.com',
        'password' => 'anypassword',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(401);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_credentials');
});

it('returns 400 when email is missing', function () {
    postJson('/api/v1/auth/login', [
        'password' => 'password123',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(400);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_request');
});
