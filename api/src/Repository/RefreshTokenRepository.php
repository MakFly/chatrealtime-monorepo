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
}
