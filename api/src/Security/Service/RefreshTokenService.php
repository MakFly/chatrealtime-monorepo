<?php

declare(strict_types=1);

namespace App\Security\Service;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;

/**
 * RefreshTokenService
 *
 * Implements advanced refresh token security features:
 * - SHA256 token hashing for secure storage (never store plaintext)
 * - Token rotation with automatic invalidation
 * - Reuse detection with automatic chain revocation
 * - IP address and User-Agent tracking for security monitoring
 * - Rotation chain tracking for forensic analysis
 *
 * @see OpenSpec auth:jwt-authentication for security requirements
 * @see AI-DD/tdd/test-first.md for TDD workflow
 */
final class RefreshTokenService implements RefreshTokenServiceInterface
{
    public function __construct(
        private readonly RefreshTokenRepository $repository
    ) {
    }

    /**
     * {@inheritDoc}
     */
    public function createToken(
        User $user,
        string $plaintextToken,
        int $ttl = 604800,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): RefreshToken {
        $token = new RefreshToken();

        // Hash token with SHA256 for secure storage
        $tokenHash = $this->hashToken($plaintextToken);
        $token->setTokenHash($tokenHash);

        // Set basic token data (Gesdinet bundle requirements)
        $token->setRefreshToken($tokenHash); // Store hash in refreshToken field too
        $token->setUsername($user->getEmail() ?? $user->getUserIdentifier());

        // Set expiry
        $expiryDate = new \DateTime();
        $expiryDate->modify("+{$ttl} seconds");
        $token->setValid($expiryDate);

        // Track security metadata
        if ($ipAddress !== null) {
            $token->setIpAddress($ipAddress);
        }

        if ($userAgent !== null) {
            $token->setUserAgent($userAgent);
        }

        // NEW tokens should NOT have rotatedAt set
        // rotatedAt is only set when a token is ROTATED (replaced), not when created

        $this->repository->save($token);

        return $token;
    }

    /**
     * {@inheritDoc}
     */
    public function verifyToken(string $plaintextToken): bool
    {
        $token = $this->findByPlaintextToken($plaintextToken);

        // Token not found
        if ($token === null) {
            return false;
        }

        // Check if token is expired
        if ($token->getValid() < new \DateTime()) {
            return false;
        }

        // REUSE DETECTION: Check if token was already rotated
        if ($token->isRotated()) {
            // Security breach! Token was rotated but someone is trying to reuse it
            // Revoke entire rotation chain to prevent attacker access
            $this->revokeTokenChain($token);
            return false;
        }

        // Check if token was revoked
        if ($token->isRevoked()) {
            return false;
        }

        return true;
    }

    /**
     * {@inheritDoc}
     */
    public function rotateToken(
        RefreshToken $oldToken,
        string $newPlaintextToken,
        ?string $ipAddress = null,
        ?string $userAgent = null
    ): RefreshToken {
        // Mark old token as rotated (invalidate it)
        $oldToken->setRotatedAt(new \DateTime());
        $this->repository->save($oldToken);

        // Create new token
        $newToken = new RefreshToken();

        // Hash new token
        $newTokenHash = $this->hashToken($newPlaintextToken);
        $newToken->setTokenHash($newTokenHash);

        // Set basic token data
        $newToken->setRefreshToken($newTokenHash);
        $newToken->setUsername($oldToken->getUsername());

        // Copy expiry from old token (or extend if needed)
        $newToken->setValid($oldToken->getValid());

        // Link to old token (rotation chain tracking)
        $newToken->setRotatedFrom($oldToken);

        // NEW tokens should NOT have rotatedAt set
        // rotatedAt will be set LATER when THIS token gets rotated

        // Track security metadata
        if ($ipAddress !== null) {
            $newToken->setIpAddress($ipAddress);
        }

        if ($userAgent !== null) {
            $newToken->setUserAgent($userAgent);
        }

        $this->repository->save($newToken);

        return $newToken;
    }

    /**
     * {@inheritDoc}
     */
    public function revokeTokenChain(RefreshToken $token): int
    {
        return $this->repository->revokeTokenChain($token);
    }

    /**
     * {@inheritDoc}
     */
    public function findByPlaintextToken(string $plaintextToken): ?RefreshToken
    {
        $tokenHash = $this->hashToken($plaintextToken);
        return $this->repository->findOneByTokenHash($tokenHash);
    }

    /**
     * {@inheritDoc}
     */
    public function getRotationChain(RefreshToken $token): array
    {
        return $this->repository->findRotationChain($token);
    }

    /**
     * Hash plaintext token with SHA256
     *
     * Security: Never store plaintext tokens in database
     * SHA256 provides:
     * - One-way hashing (irreversible)
     * - Consistent hash length (64 characters)
     * - Fast computation
     * - Adequate security for token lookup
     *
     * @param string $plaintextToken Plaintext token to hash
     * @return string SHA256 hash (64 characters)
     */
    private function hashToken(string $plaintextToken): string
    {
        return hash('sha256', $plaintextToken);
    }
}
