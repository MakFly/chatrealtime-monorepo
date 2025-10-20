<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Gesdinet\JWTRefreshTokenBundle\Model\AbstractRefreshToken;

#[ORM\Entity(repositoryClass: 'App\Repository\RefreshTokenRepository')]
#[ORM\Table(name: 'refresh_tokens')]
class RefreshToken extends AbstractRefreshToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    protected $id;

    #[ORM\Column(type: 'string', length: 128, unique: true, name: 'refresh_token')]
    protected $refreshToken;

    #[ORM\Column(type: 'string', length: 255)]
    protected $username;

    #[ORM\Column(type: 'datetime')]
    protected $valid;

    // ========================================================================
    // SECURITY ENHANCEMENTS - Token Rotation & Reuse Detection
    // @see OpenSpec auth:jwt-authentication
    // @see AI-DD/tdd/test-first.md
    // ========================================================================

    /**
     * SHA256 hash of the refresh token (never store plaintext)
     * Security: Prevents token theft from database dumps
     */
    #[ORM\Column(type: 'string', length: 64, unique: true, nullable: false)]
    private ?string $tokenHash = null;

    /**
     * Timestamp when this token was rotated (replaced with a new token)
     * Used for reuse detection: if rotated_at is set, token is invalid
     */
    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $rotatedAt = null;

    /**
     * Reference to the token that was rotated to create this one
     * Creates rotation chain: TokenA → TokenB → TokenC
     */
    #[ORM\ManyToOne(targetEntity: self::class)]
    #[ORM\JoinColumn(name: 'rotated_from_id', nullable: true, onDelete: 'SET NULL')]
    private ?RefreshToken $rotatedFrom = null;

    /**
     * Timestamp when this token was manually revoked
     * Used for security breach response: revoke all tokens in chain
     */
    #[ORM\Column(type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $revokedAt = null;

    /**
     * IP address of client when token was created
     * Security monitoring: detect unusual IP changes
     */
    #[ORM\Column(type: 'string', length: 45, nullable: true)]
    private ?string $ipAddress = null;

    /**
     * User-Agent of client when token was created
     * Security monitoring: detect device/browser changes
     */
    #[ORM\Column(type: 'string', length: 500, nullable: true)]
    private ?string $userAgent = null;

    // ========================================================================
    // GETTERS & SETTERS
    // ========================================================================

    public function getTokenHash(): ?string
    {
        return $this->tokenHash;
    }

    public function setTokenHash(string $tokenHash): self
    {
        $this->tokenHash = $tokenHash;
        return $this;
    }

    public function getRotatedAt(): ?\DateTimeInterface
    {
        return $this->rotatedAt;
    }

    public function setRotatedAt(?\DateTimeInterface $rotatedAt): self
    {
        $this->rotatedAt = $rotatedAt;
        return $this;
    }

    public function getRotatedFrom(): ?RefreshToken
    {
        return $this->rotatedFrom;
    }

    public function setRotatedFrom(?RefreshToken $rotatedFrom): self
    {
        $this->rotatedFrom = $rotatedFrom;
        return $this;
    }

    public function getRevokedAt(): ?\DateTimeInterface
    {
        return $this->revokedAt;
    }

    public function setRevokedAt(?\DateTimeInterface $revokedAt): self
    {
        $this->revokedAt = $revokedAt;
        return $this;
    }

    public function getIpAddress(): ?string
    {
        return $this->ipAddress;
    }

    public function setIpAddress(?string $ipAddress): self
    {
        $this->ipAddress = $ipAddress;
        return $this;
    }

    public function getUserAgent(): ?string
    {
        return $this->userAgent;
    }

    public function setUserAgent(?string $userAgent): self
    {
        $this->userAgent = $userAgent;
        return $this;
    }

    /**
     * Check if token has been rotated (replaced with a new token)
     * Rotated tokens should be rejected (reuse detection)
     */
    public function isRotated(): bool
    {
        return $this->rotatedAt !== null;
    }

    /**
     * Check if token has been revoked (security breach or manual revocation)
     */
    public function isRevoked(): bool
    {
        return $this->revokedAt !== null;
    }

    /**
     * Check if token is still valid (not expired, rotated, or revoked)
     */
    public function isValidToken(): bool
    {
        // Check expiry
        if ($this->valid < new \DateTime()) {
            return false;
        }

        // Check if rotated (reuse detection)
        if ($this->isRotated()) {
            return false;
        }

        // Check if revoked
        if ($this->isRevoked()) {
            return false;
        }

        return true;
    }
}
