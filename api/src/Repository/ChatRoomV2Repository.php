<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatRoomV2;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChatRoomV2>
 */
class ChatRoomV2Repository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChatRoomV2::class);
    }

    /**
     * Find all chat rooms where the user is a participant.
     *
     * @return ChatRoomV2[]
     */
    public function findByParticipant(User $user): array
    {
        return $this->createQueryBuilder('cr')
            ->innerJoin('cr.participants', 'p')
            ->where('p.user = :user')
            ->setParameter('user', $user)
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all public chat rooms.
     *
     * @return ChatRoomV2[]
     */
    public function findPublicRooms(): array
    {
        return $this->createQueryBuilder('cr')
            ->where('cr.type = :type')
            ->setParameter('type', 'public')
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all chat rooms accessible by a user.
     * Includes:
     * - Rooms where user is a participant (private/group)
     * - All public rooms (auto-joined for all authenticated users)
     *
     * @return ChatRoomV2[]
     */
    public function findAccessibleByUser(User $user): array
    {
        return $this->createQueryBuilder('cr')
            ->leftJoin('cr.participants', 'p')
            ->where('p.user = :user OR cr.type = :publicType')
            ->setParameter('user', $user)
            ->setParameter('publicType', 'public')
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find chat rooms by product ID.
     * Useful for displaying all conversations about a specific product.
     *
     * @return ChatRoomV2[]
     */
    public function findByProductId(int $productId): array
    {
        return $this->createQueryBuilder('cr')
            ->where('cr.productId = :productId')
            ->setParameter('productId', $productId)
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find existing chat room for a product between specific users.
     * Prevents duplicate rooms for same product + participants.
     *
     * @param int $productId
     * @param array<int> $userIds Array of user IDs (typically buyer + seller)
     * @return ChatRoomV2|null
     */
    public function findExistingRoomForProduct(int $productId, array $userIds): ?ChatRoomV2
    {
        $qb = $this->createQueryBuilder('cr')
            ->innerJoin('cr.participants', 'p')
            ->where('cr.productId = :productId')
            ->setParameter('productId', $productId)
            ->groupBy('cr.id')
            ->having('COUNT(DISTINCT p.user) = :userCount');

        // Add WHERE clause for each user
        foreach ($userIds as $index => $userId) {
            $alias = 'cp' . $index; // Unique alias for each subquery
            $qb->andWhere('EXISTS (
                SELECT 1 FROM App\Entity\ChatParticipantV2 ' . $alias . '
                WHERE ' . $alias . '.chatRoom = cr AND ' . $alias . '.user = :user' . $index . '
            )')
            ->setParameter('user' . $index, $userId);
        }

        $qb->setParameter('userCount', count($userIds));

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * Find user's chat rooms for a specific product.
     * Returns all rooms where user is participant for given product.
     *
     * @return ChatRoomV2[]
     */
    public function findByUserAndProduct(User $user, int $productId): array
    {
        return $this->createQueryBuilder('cr')
            ->innerJoin('cr.participants', 'p')
            ->where('p.user = :user')
            ->andWhere('cr.productId = :productId')
            ->setParameter('user', $user)
            ->setParameter('productId', $productId)
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
