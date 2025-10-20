<?php

declare(strict_types=1);

namespace App\Tests\Unit\Security;

use App\Entity\RefreshToken;
use App\Entity\User;
use App\Repository\RefreshTokenRepository;
use App\Security\Service\RefreshTokenService;
use App\Security\Service\RefreshTokenServiceInterface;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\Attributes\Test;

/**
 * RefreshTokenService Unit Tests
 *
 * Tests advanced refresh token security features:
 * - SHA256 token hashing for database storage
 * - Token rotation with reuse detection
 * - Rotation chain tracking (rotated_from)
 * - IP address and User-Agent tracking
 * - Automatic revocation on security breach
 *
 * @see AI-DD/tdd/test-first.md for TDD workflow
 * @see OpenSpec auth:jwt-authentication for token rotation spec
 */
class RefreshTokenServiceTest extends TestCase
{
    private RefreshTokenServiceInterface $service;
    private RefreshTokenRepository&MockObject $repository;

    protected function setUp(): void
    {
        $this->repository = $this->createMock(RefreshTokenRepository::class);
        $this->service = new RefreshTokenService($this->repository);
    }

    /**
     * RED: Token hashing - Tokens must be hashed with SHA256 before storage
     *
     * Security requirement: Never store plaintext tokens in database
     * @see OpenSpec auth:jwt-authentication - Token hashing requirement
     */
    #[Test]
    public function testTokenIsHashedWithSHA256BeforeStorage(): void
    {

        $user = new User();
        $user->setEmail('test@example.com');
        $plaintextToken = 'plain-refresh-token-123';
        $expectedHash = hash('sha256', $plaintextToken);

        $this->repository
            ->expects($this->once())
            ->method('save')
            ->with($this->callback(function (RefreshToken $token) use ($expectedHash) {
                // Verify token is hashed, not plaintext
                $this->assertNotEquals('plain-refresh-token-123', $token->getTokenHash());
                $this->assertEquals($expectedHash, $token->getTokenHash());
                return true;
            }));

        $this->service->createToken($user, $plaintextToken, 3600, '127.0.0.1', 'Mozilla/5.0');
    }

    /**
     * RED: Token verification - Service must verify hashed tokens
     *
     * Verification flow:
     * 1. Hash incoming plaintext token
     * 2. Find token by hash in database
     * 3. Validate expiry and revocation status
     */
    #[Test]
    public function testVerifyTokenUsingHashLookup(): void
    {

        $plaintextToken = 'refresh-token-456';
        $tokenHash = hash('sha256', $plaintextToken);

        $storedToken = new RefreshToken();
        $storedToken->setTokenHash($tokenHash);
        $storedToken->setValid(new \DateTime('+1 hour'));
        $storedToken->setRevokedAt(null);

        $this->repository
            ->expects($this->once())
            ->method('findOneByTokenHash')
            ->with($tokenHash)
            ->willReturn($storedToken);

        $result = $this->service->verifyToken($plaintextToken);

        $this->assertTrue($result);
    }

    /**
     * RED: Token rotation - Creates new token and invalidates old one
     *
     * Rotation flow:
     * 1. Create new token with different hash
     * 2. Set rotated_from to point to old token
     * 3. Track rotation timestamp (rotated_at)
     * 4. Mark old token as rotated (set rotated_at)
     *
     * @see OpenSpec auth:jwt-authentication - Token rotation requirement
     */
    #[Test]
    public function testRotateTokenCreatesNewTokenAndInvalidatesOld(): void
    {

        $oldToken = new RefreshToken();
        $oldToken->setRefreshToken('old-token-hash');
        $oldToken->setTokenHash(hash('sha256', 'old-token-plaintext'));
        $oldToken->setValid(new \DateTime('+7 days'));

        $newPlaintextToken = 'new-token-plaintext';
        $newTokenHash = hash('sha256', $newPlaintextToken);

        $this->repository
            ->expects($this->exactly(2))
            ->method('save')
            ->willReturnCallback(function ($token) use ($oldToken, $newTokenHash) {
                static $callCount = 0;
                $callCount++;

                if ($callCount === 1) {
                    // First call: Update old token with rotated_at
                    $this->assertNotNull($token->getRotatedAt());
                    $this->assertInstanceOf(\DateTimeInterface::class, $token->getRotatedAt());
                } else {
                    // Second call: Save new token
                    $this->assertEquals($newTokenHash, $token->getTokenHash());
                    $this->assertEquals($oldToken, $token->getRotatedFrom());
                    // NEW tokens should NOT have rotatedAt set (only OLD rotated tokens)
                    $this->assertNull($token->getRotatedAt());
                }
            });

        $newToken = $this->service->rotateToken($oldToken, $newPlaintextToken, '127.0.0.1', 'Mozilla/5.0');

        $this->assertNotNull($newToken->getRotatedFrom());
        $this->assertEquals($oldToken, $newToken->getRotatedFrom());
    }

    /**
     * RED: Reuse detection - Detect when rotated token is reused (security breach)
     *
     * Attack scenario:
     * 1. Attacker steals Token A
     * 2. Legitimate user rotates: Token A → Token B
     * 3. Attacker tries to use stolen Token A (already rotated)
     * 4. System detects reuse → Revoke entire chain
     *
     * @see OpenSpec auth:security - Reuse detection requirement
     */
    #[Test]
    public function testDetectTokenReuseAndRevokeChain(): void
    {

        $rotatedToken = new RefreshToken();
        $rotatedToken->setTokenHash(hash('sha256', 'rotated-token'));
        $rotatedToken->setRotatedAt(new \DateTime('-5 minutes'));
        $rotatedToken->setValid(new \DateTime('+7 days'));

        $this->repository
            ->expects($this->once())
            ->method('findOneByTokenHash')
            ->with(hash('sha256', 'rotated-token'))
            ->willReturn($rotatedToken);

        // Should revoke the token and its rotation chain
        $this->repository
            ->expects($this->once())
            ->method('revokeTokenChain')
            ->with($rotatedToken)
            ->willReturn(3); // Mock returns number of revoked tokens

        $result = $this->service->verifyToken('rotated-token');

        $this->assertFalse($result);
    }

    /**
     * RED: Chain revocation - Revoke all tokens in rotation chain
     *
     * Chain example:
     * Token A → Token B → Token C (current)
     *
     * If Token A is reused, revoke A, B, and C
     */
    #[Test]
    public function testRevokeEntireRotationChain(): void
    {

        $tokenA = new RefreshToken();
        $tokenA->setTokenHash('hash-a');

        $tokenB = new RefreshToken();
        $tokenB->setTokenHash('hash-b');
        $tokenB->setRotatedFrom($tokenA);

        $tokenC = new RefreshToken();
        $tokenC->setTokenHash('hash-c');
        $tokenC->setRotatedFrom($tokenB);

        $this->repository
            ->expects($this->once())
            ->method('revokeTokenChain')
            ->with($tokenA)
            ->willReturn(3); // Mock returns number of revoked tokens

        $count = $this->service->revokeTokenChain($tokenA);

        $this->assertEquals(3, $count);
    }

    /**
     * RED: IP tracking - Store IP address for security monitoring
     */
    #[Test]
    public function testTrackIpAddressOnTokenCreation(): void
    {

        $user = new User();
        $user->setEmail('test@example.com');
        $ipAddress = '192.168.1.100';

        $this->repository
            ->expects($this->once())
            ->method('save')
            ->with($this->callback(function (RefreshToken $token) use ($ipAddress) {
                $this->assertEquals($ipAddress, $token->getIpAddress());
                return true;
            }));

        $this->service->createToken($user, 'token', 3600, $ipAddress, 'Mozilla/5.0');
    }

    /**
     * RED: User-Agent tracking - Store User-Agent for security monitoring
     */
    #[Test]
    public function testTrackUserAgentOnTokenCreation(): void
    {

        $user = new User();
        $user->setEmail('test@example.com');
        $userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0';

        $this->repository
            ->expects($this->once())
            ->method('save')
            ->with($this->callback(function (RefreshToken $token) use ($userAgent) {
                $this->assertEquals($userAgent, $token->getUserAgent());
                return true;
            }));

        $this->service->createToken($user, 'token', 3600, '127.0.0.1', $userAgent);
    }

    /**
     * RED: Expired tokens - Reject tokens past expiry date
     */
    #[Test]
    public function testRejectExpiredTokens(): void
    {

        $expiredToken = new RefreshToken();
        $expiredToken->setTokenHash(hash('sha256', 'expired-token'));
        $expiredToken->setValid(new \DateTime('-1 hour')); // Expired
        $expiredToken->setRevokedAt(null);

        $this->repository
            ->expects($this->once())
            ->method('findOneByTokenHash')
            ->with(hash('sha256', 'expired-token'))
            ->willReturn($expiredToken);

        $result = $this->service->verifyToken('expired-token');

        $this->assertFalse($result);
    }

    /**
     * RED: Revoked tokens - Reject manually revoked tokens
     */
    #[Test]
    public function testRejectRevokedTokens(): void
    {

        $revokedToken = new RefreshToken();
        $revokedToken->setTokenHash(hash('sha256', 'revoked-token'));
        $revokedToken->setValid(new \DateTime('+7 days'));
        $revokedToken->setRevokedAt(new \DateTime('-1 hour')); // Revoked

        $this->repository
            ->expects($this->once())
            ->method('findOneByTokenHash')
            ->with(hash('sha256', 'revoked-token'))
            ->willReturn($revokedToken);

        $result = $this->service->verifyToken('revoked-token');

        $this->assertFalse($result);
    }

    /**
     * RED: Token not found - Return false for unknown tokens
     */
    #[Test]
    public function testRejectUnknownTokens(): void
    {

        $this->repository
            ->expects($this->once())
            ->method('findOneByTokenHash')
            ->with(hash('sha256', 'unknown-token'))
            ->willReturn(null);

        $result = $this->service->verifyToken('unknown-token');

        $this->assertFalse($result);
    }
}
