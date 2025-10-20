<?php

declare(strict_types=1);

namespace App\Security\Service;

use App\Entity\RefreshToken;
use App\Entity\User;

/**
 * RefreshTokenServiceInterface
 *
 * Defines contract for advanced refresh token security features:
 * - SHA256 token hashing for secure storage
 * - Token rotation with reuse detection
 * - Rotation chain tracking
 * - IP address and User-Agent monitoring
 * - Automatic chain revocation on security breach
 *
 * @see OpenSpec auth:jwt-authentication for token rotation requirements
 * @see AI-DD/interfaces/when-to-use.md for interface usage guidelines
 */
interface RefreshTokenServiceInterface
{
    /**
     * Create a new refresh token with security features
     *
     * - Hashes token with SHA256 before storage
     * - Stores IP address and User-Agent for monitoring
     * - Sets expiry timestamp
     *
     * @param User $user User who owns the token
     * @param string $plaintextToken Plaintext refresh token (will be hashed)
     * @param int $ttl Time-to-live in seconds (default: 7 days)
     * @param string|null $ipAddress Client IP address for security monitoring
     * @param string|null $userAgent Client User-Agent for security monitoring
     *
     * @return RefreshToken The created token entity
     */
    public function createToken(
        User $user,
        string $plaintextToken,
        int $ttl = 604800,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): RefreshToken;

    /**
     * Verify a refresh token is valid
     *
     * Validation checks:
     * 1. Token exists (hash lookup)
     * 2. Not expired
     * 3. Not rotated (reuse detection)
     * 4. Not revoked
     *
     * Security: If rotated token is used, triggers chain revocation
     *
     * @param string $plaintextToken Plaintext token to verify
     *
     * @return bool True if valid, false otherwise
     */
    public function verifyToken(string $plaintextToken): bool;

    /**
     * Rotate a refresh token (replace with new token)
     *
     * Rotation flow:
     * 1. Mark old token as rotated (set rotated_at)
     * 2. Create new token with hash
     * 3. Link new token to old (rotated_from)
     * 4. Track rotation timestamp
     *
     * @param RefreshToken $oldToken Token to rotate
     * @param string $newPlaintextToken New plaintext token (will be hashed)
     * @param string|null $ipAddress Client IP address
     * @param string|null $userAgent Client User-Agent
     *
     * @return RefreshToken The new rotated token
     */
    public function rotateToken(
        RefreshToken $oldToken,
        string $newPlaintextToken,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): RefreshToken;

    /**
     * Revoke entire token rotation chain
     *
     * Used when reuse is detected (security breach):
     * - If Token A is reused after rotation to Token B
     * - Revoke Token A, Token B, and all descendants
     *
     * Chain example: A → B → C (current)
     * If A is reused, revoke A, B, C
     *
     * @param RefreshToken $token Starting point in chain
     *
     * @return int Number of tokens revoked
     */
    public function revokeTokenChain(RefreshToken $token): int;

    /**
     * Find refresh token by plaintext token
     *
     * - Hashes plaintext token
     * - Looks up by token_hash
     *
     * @param string $plaintextToken Plaintext token to find
     *
     * @return RefreshToken|null Token if found, null otherwise
     */
    public function findByPlaintextToken(string $plaintextToken): ?RefreshToken;

    /**
     * Get rotation chain for a token
     *
     * Returns all tokens in rotation chain:
     * - Parent tokens (rotated_from ancestors)
     * - Child tokens (tokens rotated from this one)
     *
     * @param RefreshToken $token Token to get chain for
     *
     * @return array<RefreshToken> All tokens in chain
     */
    public function getRotationChain(RefreshToken $token): array;
}
