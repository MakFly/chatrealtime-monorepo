<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\RefreshToken;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;
use Gesdinet\JWTRefreshTokenBundle\Doctrine\RefreshTokenRepositoryInterface;
use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenInterface;

/**
 * @extends ServiceEntityRepository<RefreshToken>
 */
class RefreshTokenRepository extends ServiceEntityRepository implements RefreshTokenRepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, RefreshToken::class);
    }

    public function findInvalid($datetime = null): array
    {
        $datetime = $datetime ?? new \DateTime();
        
        return $this->createQueryBuilder('rt')
            ->where('rt.valid < :datetime')
            ->setParameter('datetime', $datetime)
            ->getQuery()
            ->getResult();
    }

    public function findOneByRefreshToken(string $refreshToken): ?RefreshTokenInterface
    {
        return $this->createQueryBuilder('rt')
            ->where('rt.refreshToken = :refreshToken')
            ->setParameter('refreshToken', $refreshToken)
            ->getQuery()
            ->getOneOrNullResult();
    }

    public function findOneByUsername(string $username): ?RefreshTokenInterface
    {
        return $this->createQueryBuilder('rt')
            ->where('rt.username = :username')
            ->setParameter('username', $username)
            ->getQuery()
            ->getOneOrNullResult();
    }

    // ========================================================================
    // SECURITY ENHANCEMENTS - Token Rotation & Reuse Detection
    // @see OpenSpec auth:jwt-authentication
    // ========================================================================

    /**
     * Save or update a refresh token
     */
    public function save(RefreshToken $token, bool $flush = true): void
    {
        $this->getEntityManager()->persist($token);

        if ($flush) {
            $this->getEntityManager()->flush();
        }
    }

    /**
     * Find refresh token by SHA256 hash
     *
     * @param string $tokenHash SHA256 hash of the token
     * @return RefreshToken|null
     */
    public function findOneByTokenHash(string $tokenHash): ?RefreshToken
    {
        return $this->createQueryBuilder('rt')
            ->where('rt.tokenHash = :tokenHash')
            ->setParameter('tokenHash', $tokenHash)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Get entire rotation chain for a token (ancestors and descendants)
     *
     * Returns all tokens in rotation chain:
     * - Parent chain: token.rotatedFrom → parent.rotatedFrom → ...
     * - Children: tokens where rotatedFrom = this token
     *
     * @param RefreshToken $token Starting token
     * @return array<RefreshToken> All tokens in chain
     */
    public function findRotationChain(RefreshToken $token): array
    {
        $chain = [$token];

        // Get parent chain (ancestors)
        $current = $token;
        while ($parent = $current->getRotatedFrom()) {
            $chain[] = $parent;
            $current = $parent;
        }

        // Get children (descendants)
        $descendants = $this->findDescendants($token);
        $chain = array_merge($chain, $descendants);

        return array_unique($chain, SORT_REGULAR);
    }

    /**
     * Find all descendant tokens (tokens rotated from this one)
     *
     * @param RefreshToken $token Parent token
     * @return array<RefreshToken> All descendant tokens
     */
    private function findDescendants(RefreshToken $token): array
    {
        $descendants = [];

        $children = $this->createQueryBuilder('rt')
            ->where('rt.rotatedFrom = :token')
            ->setParameter('token', $token)
            ->getQuery()
            ->getResult();

        foreach ($children as $child) {
            $descendants[] = $child;
            // Recursively get children's children
            $descendants = array_merge($descendants, $this->findDescendants($child));
        }

        return $descendants;
    }

    /**
     * Revoke all tokens in a rotation chain
     *
     * Sets revoked_at timestamp on all tokens in chain
     *
     * @param RefreshToken $token Starting token
     * @return int Number of tokens revoked
     */
    public function revokeTokenChain(RefreshToken $token): int
    {
        $chain = $this->findRotationChain($token);
        $count = 0;

        foreach ($chain as $chainToken) {
            if (!$chainToken->isRevoked()) {
                $chainToken->setRevokedAt(new \DateTime());
                $this->save($chainToken, false);
                $count++;
            }
        }

        $this->getEntityManager()->flush();

        return $count;
    }
}
