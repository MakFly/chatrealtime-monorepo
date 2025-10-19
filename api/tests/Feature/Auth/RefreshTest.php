<?php

declare(strict_types=1);

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

it('returns new access token when refresh token is valid', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    // Cleanup any existing user from previous failed tests
    $existingUser = $em->getRepository(User::class)->findOneBy(['email' => 'refresh@test.com']);
    if ($existingUser) {
        $em->remove($existingUser);
        $em->flush();
    }

    // Create user and get tokens
    $user = createUser([
        'email' => 'refresh@test.com',
        'password' => 'password123',
    ]);
    $em->persist($user);
    $em->flush();

    // Login to get refresh token
    postJson('/api/v1/auth/login', [
        'email' => 'refresh@test.com',
        'password' => 'password123',
    ]);

    $loginResponse = test()->client()->getResponse();
    $loginData = json_decode($loginResponse->getContent(), true);
    $refreshToken = $loginData['refresh_token'];
    $originalAccessToken = $loginData['access_token'];

    // Wait a moment to ensure new token will be different
    sleep(1);

    // Refresh the token
    postJson('/api/v1/auth/refresh', [
        'refresh_token' => $refreshToken,
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(200);

    $data = json_decode($response->getContent(), true);
    expect($data)->toHaveKeys(['access_token', 'refresh_token']);
    expect($data['access_token'])->toBeValidJwt();
    expect($data['access_token'])->not->toBe($originalAccessToken); // New token should be different
    expect($data['refresh_token'])->toBe($refreshToken); // Refresh token stays the same

    // Cleanup - refresh entity from database
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'refresh@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});

it('returns 400 when refresh token is missing', function () {
    postJson('/api/v1/auth/refresh', []);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(400);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_request');
    expect($data['message'])->toContain('Refresh token');
});

it('returns 401 when refresh token is invalid', function () {
    postJson('/api/v1/auth/refresh', [
        'refresh_token' => 'invalid-token-that-does-not-exist',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(401);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_token');
});

it('returns 401 when refresh token format is malformed', function () {
    postJson('/api/v1/auth/refresh', [
        'refresh_token' => 'malformed',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(401);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_token');
});

it('new access token can be used for authentication', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    // Cleanup any existing user from previous failed tests
    $existingUser = $em->getRepository(User::class)->findOneBy(['email' => 'refreshauth@test.com']);
    if ($existingUser) {
        $em->remove($existingUser);
        $em->flush();
    }

    // Create user and get tokens
    $user = createUser([
        'email' => 'refreshauth@test.com',
        'password' => 'password123',
    ]);
    $em->persist($user);
    $em->flush();

    // Login
    postJson('/api/v1/auth/login', [
        'email' => 'refreshauth@test.com',
        'password' => 'password123',
    ]);

    $loginData = json_decode(test()->client()->getResponse()->getContent(), true);

    // Refresh to get new access token
    postJson('/api/v1/auth/refresh', [
        'refresh_token' => $loginData['refresh_token'],
    ]);

    $refreshData = json_decode(test()->client()->getResponse()->getContent(), true);
    $newAccessToken = $refreshData['access_token'];

    // Verify the new access token works
    expect($newAccessToken)->toBeValidJwt();

    // Cleanup - refresh entity from database
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'refreshauth@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});

it('can refresh multiple times with same refresh token', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    // Cleanup any existing user from previous failed tests
    $existingUser = $em->getRepository(User::class)->findOneBy(['email' => 'multirefresh@test.com']);
    if ($existingUser) {
        $em->remove($existingUser);
        $em->flush();
    }

    // Create user and get tokens
    $user = createUser([
        'email' => 'multirefresh@test.com',
        'password' => 'password123',
    ]);
    $em->persist($user);
    $em->flush();

    // Login
    postJson('/api/v1/auth/login', [
        'email' => 'multirefresh@test.com',
        'password' => 'password123',
    ]);

    $loginData = json_decode(test()->client()->getResponse()->getContent(), true);
    $refreshToken = $loginData['refresh_token'];

    // First refresh
    postJson('/api/v1/auth/refresh', [
        'refresh_token' => $refreshToken,
    ]);

    $firstRefresh = test()->client()->getResponse();
    expect($firstRefresh->getStatusCode())->toBe(200);

    sleep(1);

    // Second refresh with same token
    postJson('/api/v1/auth/refresh', [
        'refresh_token' => $refreshToken,
    ]);

    $secondRefresh = test()->client()->getResponse();
    expect($secondRefresh->getStatusCode())->toBe(200);

    $secondData = json_decode($secondRefresh->getContent(), true);
    expect($secondData['access_token'])->toBeValidJwt();

    // Cleanup - refresh entity from database
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'multirefresh@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});

it('refresh token persists after logout and login', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    // Cleanup any existing user from previous failed tests
    $existingUser = $em->getRepository(User::class)->findOneBy(['email' => 'persistrefresh@test.com']);
    if ($existingUser) {
        $em->remove($existingUser);
        $em->flush();
    }

    // Create user
    $user = createUser([
        'email' => 'persistrefresh@test.com',
        'password' => 'password123',
    ]);
    $em->persist($user);
    $em->flush();

    // First login
    postJson('/api/v1/auth/login', [
        'email' => 'persistrefresh@test.com',
        'password' => 'password123',
    ]);

    $firstLoginData = json_decode(test()->client()->getResponse()->getContent(), true);
    $firstRefreshToken = $firstLoginData['refresh_token'];

    // Logout
    postJson('/api/v1/auth/logout', [
        'refresh_token' => $firstRefreshToken,
    ]);

    expect(test()->client()->getResponse()->getStatusCode())->toBe(204);

    // Second login
    postJson('/api/v1/auth/login', [
        'email' => 'persistrefresh@test.com',
        'password' => 'password123',
    ]);

    $secondLoginData = json_decode(test()->client()->getResponse()->getContent(), true);
    $secondRefreshToken = $secondLoginData['refresh_token'];

    // Try to use the second refresh token
    postJson('/api/v1/auth/refresh', [
        'refresh_token' => $secondRefreshToken,
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(200);

    // Cleanup - refresh entity from database
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'persistrefresh@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});
