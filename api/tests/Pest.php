<?php

declare(strict_types=1);

use App\Entity\User;
use App\Tests\TestCase;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
*/

pest()->extend(TestCase::class)->in(__DIR__);

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
*/

expect()->extend('toBeValidJwt', function () {
    expect($this->value)
        ->toBeString()
        ->toMatch('/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/');

    return $this;
});

/*
|--------------------------------------------------------------------------
| Global Helper Functions
|--------------------------------------------------------------------------
*/

function createUser(array $attributes = []): User
{
    $user = new User();
    $user->setEmail($attributes['email'] ?? 'test@example.com');

    if (isset($attributes['password'])) {
        $hasher = test()->getContainer()->get('security.user_password_hasher');
        $user->setPassword($hasher->hashPassword($user, $attributes['password']));
    }

    $user->setName($attributes['name'] ?? 'Test User');
    $user->setRoles($attributes['roles'] ?? ['ROLE_USER']);

    if (isset($attributes['googleId'])) {
        $user->setGoogleId($attributes['googleId']);
    }

    if (isset($attributes['googleAccessToken'])) {
        $user->setGoogleAccessToken($attributes['googleAccessToken']);
    }

    if (isset($attributes['picture'])) {
        $user->setPicture($attributes['picture']);
    }

    return $user;
}

function generateJwt(User $user): string
{
    return test()->getContainer()->get(JWTTokenManagerInterface::class)->create($user);
}

function actingAs(User $user): void
{
    $token = generateJwt($user);
    test()->withHeader('Authorization', "Bearer {$token}");
}

function postJson(string $uri, array $data = []): mixed
{
    return test()->client()->request('POST', $uri, [], [], [
        'CONTENT_TYPE' => 'application/json',
        'HTTP_ACCEPT' => 'application/json',
    ], json_encode($data));
}

function getJson(string $uri, array $headers = []): mixed
{
    $serverHeaders = [
        'HTTP_ACCEPT' => 'application/json',
    ];

    foreach ($headers as $key => $value) {
        $serverHeaders['HTTP_' . strtoupper(str_replace('-', '_', $key))] = $value;
    }

    return test()->client()->request('GET', $uri, [], [], $serverHeaders);
}
