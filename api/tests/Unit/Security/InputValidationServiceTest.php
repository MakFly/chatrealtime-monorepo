<?php

declare(strict_types=1);

namespace App\Tests\Unit\Security;

use App\Security\Service\InputValidationService;
use PHPUnit\Framework\TestCase;

class InputValidationServiceTest extends TestCase
{
    private InputValidationService $service;

    protected function setUp(): void
    {
        $this->service = new InputValidationService();
    }

    public function testValidateEmailWithValidEmail(): void
    {
        $this->assertTrue($this->service->validateEmail('user@example.com'));
        $this->assertTrue($this->service->validateEmail('test.user+tag@example.co.uk'));
    }

    public function testValidateEmailWithInvalidEmail(): void
    {
        $this->assertFalse($this->service->validateEmail('invalid'));
        $this->assertFalse($this->service->validateEmail('user@'));
        $this->assertFalse($this->service->validateEmail('@example.com'));
        $this->assertFalse($this->service->validateEmail(''));
    }

    public function testValidatePasswordStrengthWithStrongPassword(): void
    {
        $errors = $this->service->validatePasswordStrength('StrongP@ss123');
        $this->assertEmpty($errors);
    }

    public function testValidatePasswordStrengthWithWeakPassword(): void
    {
        $errors = $this->service->validatePasswordStrength('weak');
        $this->assertNotEmpty($errors);
        $this->assertCount(4, $errors); // Manque majuscule, chiffre, caractère spécial, longueur
    }

    public function testDetectSqlInjection(): void
    {
        $this->assertTrue($this->service->detectSqlInjection("SELECT * FROM users"));
        $this->assertTrue($this->service->detectSqlInjection("admin' OR '1'='1"));
        $this->assertTrue($this->service->detectSqlInjection("DROP TABLE users"));
        $this->assertFalse($this->service->detectSqlInjection("normal text"));
    }

    public function testDetectXss(): void
    {
        $this->assertTrue($this->service->detectXss("<script>alert('xss')</script>"));
        $this->assertTrue($this->service->detectXss("<iframe src='evil.com'></iframe>"));
        $this->assertTrue($this->service->detectXss("javascript:alert(1)"));
        $this->assertFalse($this->service->detectXss("normal text"));
    }

    public function testSanitizeInput(): void
    {
        $input = "<script>alert('xss')</script>Hello World";
        $sanitized = $this->service->sanitizeInput($input);
        $this->assertStringNotContainsString('<script>', $sanitized);
        $this->assertStringContainsString('Hello World', $sanitized);
    }
}
