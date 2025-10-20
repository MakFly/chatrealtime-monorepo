<?php

declare(strict_types=1);

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;

it('returns JWT when registration is successful with all fields', function () {
    postJson('/api/v1/auth/register', [
        'email' => 'newuser@test.com',
        'password' => 'SecureP@ssw0rd!', // Strong password: uppercase, lowercase, numbers, special chars
        'name' => 'New User',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(201);

    $data = json_decode($response->getContent(), true);
    expect($data)->toHaveKeys(['access_token', 'refresh_token', 'token_type', 'expires_in', 'user']);
    expect($data['access_token'])->toBeValidJwt();
    expect($data['token_type'])->toBe('Bearer');
    expect($data['expires_in'])->toBe(3600);
    expect($data['user']['email'])->toBe('newuser@test.com');
    expect($data['user']['name'])->toBe('New User');

    // Cleanup
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'newuser@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});

it('returns JWT when registration is successful without optional name', function () {
    postJson('/api/v1/auth/register', [
        'email' => 'noname@test.com',
        'password' => 'SecureP@ssw0rd!',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(201);

    $data = json_decode($response->getContent(), true);
    expect($data)->toHaveKeys(['access_token', 'refresh_token', 'token_type', 'expires_in', 'user']);
    expect($data['access_token'])->toBeValidJwt();
    expect($data['user']['email'])->toBe('noname@test.com');
    expect($data['user']['name'])->toBeNull();

    // Cleanup
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'noname@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});

it('returns 409 when email already exists', function () {
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);

    // Create existing user
    $existingUser = createUser([
        'email' => 'existing@test.com',
        'password' => 'SecureP@ssw0rd!',
    ]);
    $em->persist($existingUser);
    $em->flush();

    // Try to register with same email
    postJson('/api/v1/auth/register', [
        'email' => 'existing@test.com',
        'password' => 'DifferentP@ss1!', // Strong password with digit
        'name' => 'Different Name',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(409);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('email_exists');
    expect($data['message'])->toContain('existe déjà');

    // Cleanup
    $em->remove($existingUser);
    $em->flush();
});

it('returns 400 when email is missing', function () {
    postJson('/api/v1/auth/register', [
        'password' => 'password123',
        'name' => 'No Email User',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(400);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_request');
    expect($data['message'])->toContain('Email');
});

it('returns 400 when password is missing', function () {
    postJson('/api/v1/auth/register', [
        'email' => 'nopassword@test.com',
        'name' => 'No Password User',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(400);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_request');
    expect($data['message'])->toContain('mot de passe');
});

it('returns 400 when both email and password are missing', function () {
    postJson('/api/v1/auth/register', [
        'name' => 'No Credentials User',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(400);

    $data = json_decode($response->getContent(), true);
    expect($data['error'])->toBe('invalid_request');
});

it('creates user in database with hashed password', function () {
    postJson('/api/v1/auth/register', [
        'email' => 'hashtest@test.com',
        'password' => 'PlainT3xt!',
        'name' => 'Hash Test User',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(201);

    // Verify user exists in database
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'hashtest@test.com']);

    expect($user)->not->toBeNull();
    expect($user->getEmail())->toBe('hashtest@test.com');
    expect($user->getName())->toBe('Hash Test User');

    // Verify password is hashed (not plaintext)
    expect($user->getPassword())->not->toBe('PlainT3xt!');
    expect($user->getPassword())->toStartWith('$');

    // Verify user has default role
    expect($user->getRoles())->toContain('ROLE_USER');

    // Cleanup
    $em->remove($user);
    $em->flush();
});

it('can login immediately after registration', function () {
    // First register
    postJson('/api/v1/auth/register', [
        'email' => 'loginafter@test.com',
        'password' => 'SecureP@ssw0rd!',
        'name' => 'Login After User',
    ]);

    $registerResponse = test()->client()->getResponse();
    expect($registerResponse->getStatusCode())->toBe(201);

    // Then try to login
    postJson('/api/v1/auth/login', [
        'email' => 'loginafter@test.com',
        'password' => 'SecureP@ssw0rd!',
    ]);

    $loginResponse = test()->client()->getResponse();
    expect($loginResponse->getStatusCode())->toBe(200);

    $loginData = json_decode($loginResponse->getContent(), true);
    expect($loginData)->toHaveKeys(['access_token', 'refresh_token']);
    expect($loginData['access_token'])->toBeValidJwt();

    // Cleanup
    $em = test()->client()->getContainer()->get(EntityManagerInterface::class);
    $user = $em->getRepository(User::class)->findOneBy(['email' => 'loginafter@test.com']);
    if ($user) {
        $em->remove($user);
        $em->flush();
    }
});
