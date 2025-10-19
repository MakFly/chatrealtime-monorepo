<?php

declare(strict_types=1);

namespace App\Security\Interface;

interface InputValidationServiceInterface
{
    public function validateEmail(string $email): bool;

    public function validatePasswordStrength(string $password): array;

    public function sanitizeInput(string $input): string;

    public function detectSqlInjection(string $input): bool;

    public function detectXss(string $input): bool;
}
