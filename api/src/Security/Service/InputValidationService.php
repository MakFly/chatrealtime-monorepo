<?php

declare(strict_types=1);

namespace App\Security\Service;

use App\Security\Interface\InputValidationServiceInterface;

class InputValidationService implements InputValidationServiceInterface
{
    private const EMAIL_REGEX = '/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/';
    private const MIN_PASSWORD_LENGTH = 8;
    private const SQL_INJECTION_PATTERNS = [
        '/(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bUNION\b|\bEXEC\b)/i',
        '/(\bOR\b\s+[\'\"]?\d+[\'\"]?\s*=\s*[\'\"]?\d+[\'\"]?|\bAND\b\s+[\'\"]?\d+[\'\"]?\s*=\s*[\'\"]?\d+[\'\"]?)/i',
        '/(--|#|\/\*|\*\/)/i',
        '/(\bxp_cmdshell\b|\bsp_executesql\b)/i',
        '/[\'\"][\s]*(\bOR\b|\bAND\b)[\s]*[\'\"]?\d+[\'\"]?\s*=\s*[\'\"]?\d+/i',
    ];
    private const XSS_PATTERNS = [
        '/<script[^>]*>.*?<\/script>/is',
        '/<iframe[^>]*>.*?<\/iframe>/is',
        '/javascript:/i',
        '/on\w+\s*=/i',
        '/<embed[^>]*>/i',
        '/<object[^>]*>/i',
    ];

    public function validateEmail(string $email): bool
    {
        if (empty($email)) {
            return false;
        }

        // Vérifier le format
        if (!preg_match(self::EMAIL_REGEX, $email)) {
            return false;
        }

        // Vérifier la longueur
        if (strlen($email) > 180) {
            return false;
        }

        // Vérifier les caractères dangereux
        if ($this->detectSqlInjection($email) || $this->detectXss($email)) {
            return false;
        }

        return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
    }

    public function validatePasswordStrength(string $password): array
    {
        $errors = [];

        if (strlen($password) < self::MIN_PASSWORD_LENGTH) {
            $errors[] = sprintf('Le mot de passe doit contenir au moins %d caractères', self::MIN_PASSWORD_LENGTH);
        }

        if (!preg_match('/[a-z]/', $password)) {
            $errors[] = 'Le mot de passe doit contenir au moins une lettre minuscule';
        }

        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Le mot de passe doit contenir au moins une lettre majuscule';
        }

        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Le mot de passe doit contenir au moins un chiffre';
        }

        if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
            $errors[] = 'Le mot de passe doit contenir au moins un caractère spécial';
        }

        return $errors;
    }

    public function sanitizeInput(string $input): string
    {
        // Supprimer les balises HTML et PHP
        $sanitized = strip_tags($input);

        // Échapper les entités HTML
        $sanitized = htmlspecialchars($sanitized, ENT_QUOTES | ENT_HTML5, 'UTF-8');

        // Supprimer les caractères de contrôle
        $sanitized = preg_replace('/[\x00-\x1F\x7F]/u', '', $sanitized);

        return trim($sanitized);
    }

    public function detectSqlInjection(string $input): bool
    {
        foreach (self::SQL_INJECTION_PATTERNS as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }

        return false;
    }

    public function detectXss(string $input): bool
    {
        foreach (self::XSS_PATTERNS as $pattern) {
            if (preg_match($pattern, $input)) {
                return true;
            }
        }

        return false;
    }
}
