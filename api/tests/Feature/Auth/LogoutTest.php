<?php

declare(strict_types=1);

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

it('returns 204 when logout is successful', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    // Cleanup any existing user
    $existingUser = $em->getRepository(User::class)->findOneBy(['email' => 'logout@test.com']);
    if ($existingUser) {
        $em->remove($existingUser);
        $em->flush();
    }

    // Create user and login
    $user = createUser([
        'email' => 'logout@test.com',
        'password' => 'password123',
    ]);
    $em->persist($user);
    $em->flush();

    postJson('/api/v1/auth/login', [
        'email' => 'logout@test.com',
        'password' => 'password123',
    ]);

    $loginData = json_decode(test()->client()->getResponse()->getContent(), true);
    $refreshToken = $loginData['refresh_token'];

    // Logout
    postJson('/api/v1/auth/logout', [
        'refresh_token' => $refreshToken,
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(204);
    expect($response->getContent())->toBeEmpty();

    // Cleanup
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'logout@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});

it('returns 400 when refresh token is missing', function () {
    postJson('/api/v1/auth/logout', []);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(400);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_request');
    expect($data['message'])->toContain('Refresh token');
});

it('returns 204 even when token does not exist (idempotent)', function () {
    postJson('/api/v1/auth/logout', [
        'refresh_token' => 'non-existent-token-12345',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(204);
});

it('cannot use refresh token after logout', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    // Cleanup any existing user
    $existingUser = $em->getRepository(User::class)->findOneBy(['email' => 'logoutrefresh@test.com']);
    if ($existingUser) {
        $em->remove($existingUser);
        $em->flush();
    }

    // Create user and login
    $user = createUser([
        'email' => 'logoutrefresh@test.com',
        'password' => 'password123',
    ]);
    $em->persist($user);
    $em->flush();

    postJson('/api/v1/auth/login', [
        'email' => 'logoutrefresh@test.com',
        'password' => 'password123',
    ]);

    $loginData = json_decode(test()->client()->getResponse()->getContent(), true);
    $refreshToken = $loginData['refresh_token'];

    // Logout
    postJson('/api/v1/auth/logout', [
        'refresh_token' => $refreshToken,
    ]);

    expect(test()->client()->getResponse()->getStatusCode())->toBe(204);

    // Try to use the refresh token
    postJson('/api/v1/auth/refresh', [
        'refresh_token' => $refreshToken,
    ]);

    $refreshResponse = test()->client()->getResponse();
    expect($refreshResponse->getStatusCode())->toBe(401);

    $refreshData = json_decode($refreshResponse->getContent(), true);
    expect($refreshData['error'])->toBe('invalid_token');

    // Cleanup
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'logoutrefresh@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});

it('can login again after logout', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    // Cleanup any existing user
    $existingUser = $em->getRepository(User::class)->findOneBy(['email' => 'relogin@test.com']);
    if ($existingUser) {
        $em->remove($existingUser);
        $em->flush();
    }

    // Create user and first login
    $user = createUser([
        'email' => 'relogin@test.com',
        'password' => 'password123',
    ]);
    $em->persist($user);
    $em->flush();

    postJson('/api/v1/auth/login', [
        'email' => 'relogin@test.com',
        'password' => 'password123',
    ]);

    $firstLoginData = json_decode(test()->client()->getResponse()->getContent(), true);

    // Logout
    postJson('/api/v1/auth/logout', [
        'refresh_token' => $firstLoginData['refresh_token'],
    ]);

    expect(test()->client()->getResponse()->getStatusCode())->toBe(204);

    // Login again
    postJson('/api/v1/auth/login', [
        'email' => 'relogin@test.com',
        'password' => 'password123',
    ]);

    $secondLoginResponse = test()->client()->getResponse();
    expect($secondLoginResponse->getStatusCode())->toBe(200);

    $secondLoginData = json_decode($secondLoginResponse->getContent(), true);
    expect($secondLoginData)->toHaveKeys(['access_token', 'refresh_token']);
    expect($secondLoginData['access_token'])->toBeValidJwt();

    // Cleanup
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'relogin@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});

it('logout with malformed token still returns 204', function () {
    postJson('/api/v1/auth/logout', [
        'refresh_token' => 'malformed',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(204);
});
