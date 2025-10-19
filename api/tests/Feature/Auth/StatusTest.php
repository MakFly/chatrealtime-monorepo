<?php

declare(strict_types=1);

it('returns auth status without authentication', function () {
    test()->client()->request('GET', '/api/v1/auth/status');

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(200);

    $data = json_decode($response->getContent(), true);
    expect($data)->toHaveKeys(['auth_methods', 'api_version']);
});

it('returns email_password as enabled', function () {
    test()->client()->request('GET', '/api/v1/auth/status');

    $data = json_decode(test()->client()->getResponse()->getContent(), true);
    expect($data['auth_methods']['email_password'])->toBeTrue();
});

it('returns google_sso status from environment', function () {
    test()->client()->request('GET', '/api/v1/auth/status');

    $data = json_decode(test()->client()->getResponse()->getContent(), true);
    expect($data['auth_methods'])->toHaveKey('google_sso');
    expect($data['auth_methods']['google_sso'])->toBeIn([true, false]);
});

it('returns api version', function () {
    test()->client()->request('GET', '/api/v1/auth/status');

    $data = json_decode(test()->client()->getResponse()->getContent(), true);
    expect($data['api_version'])->toBe('v1');
});

it('is accessible without authentication token', function () {
    // Make request without any authorization header
    test()->client()->request('GET', '/api/v1/auth/status', [], [], [
        'HTTP_ACCEPT' => 'application/json',
    ]);

    $response = test()->client()->getResponse();
    expect($response->getStatusCode())->toBe(200);

    $data = json_decode($response->getContent(), true);
    expect($data)->toHaveKeys(['auth_methods', 'api_version']);
});

it('returns consistent response structure', function () {
    test()->client()->request('GET', '/api/v1/auth/status');

    $data = json_decode(test()->client()->getResponse()->getContent(), true);

    expect($data)->toHaveKeys(['auth_methods', 'api_version']);
    expect($data['auth_methods'])->toBeArray();
    expect($data['api_version'])->toBeString();

    expect($data['auth_methods'])->toHaveKeys(['email_password', 'google_sso']);
    expect($data['auth_methods']['email_password'])->toBeBool();
    expect($data['auth_methods']['google_sso'])->toBeBool();
});
