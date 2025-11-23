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
     * Excludes rooms where the user has soft-deleted their participation.
     *
     * @return ChatRoomV2[]
     */
    public function findByParticipant(User $user): array
    {
        return $this->createQueryBuilder('cr')
            ->innerJoin('cr.participants', 'p')
            ->where('p.user = :user')
            ->andWhere('p.deletedAt IS NULL')
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
     * - Rooms where user is a participant (private/group) and hasn't soft-deleted
     * - All public rooms (auto-joined for all authenticated users)
     *
     * This method automatically creates ChatParticipantV2 records for public rooms
     * where the user isn't yet a participant. This enables unread count tracking
     * and Mercure notifications for public rooms.
     *
     * @return ChatRoomV2[]
     */
    public function findAccessibleByUser(User $user): array
    {
        // Fetch rooms where user is an active participant
        $participantRooms = $this->createQueryBuilder('cr')
            ->innerJoin('cr.participants', 'p')
            ->where('p.user = :user')
            ->andWhere('p.deletedAt IS NULL')
            ->setParameter('user', $user)
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();

        // Fetch all public rooms
        $publicRooms = $this->findPublicRooms();

        // Auto-join public rooms: Create participant records for public rooms
        // where user isn't yet a participant
        $em = $this->getEntityManager();
        $autoJoinCount = 0;
        $existingParticipantRoomIds = array_map(fn($room) => $room->getId(), $participantRooms);

        foreach ($publicRooms as $publicRoom) {
            if (!in_array($publicRoom->getId(), $existingParticipantRoomIds, true)) {
                $participant = new \App\Entity\ChatParticipantV2();
                $participant->setUser($user);
                $participant->setChatRoom($publicRoom);
                $participant->setRole('member');
                $em->persist($participant);
                $autoJoinCount++;

                // Add to result list
                $participantRooms[] = $publicRoom;
            }
        }

        if ($autoJoinCount > 0) {
            $em->flush();
        }

        // Sort by updatedAt DESC
        usort($participantRooms, fn($a, $b) => $b->getUpdatedAt() <=> $a->getUpdatedAt());

        return $participantRooms;
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
     * Ignores soft-delete status to allow restoring deleted conversations.
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
                WHERE ' . $alias . '.chatRoom = cr
                AND ' . $alias . '.user = :user' . $index . '
            )')
            ->setParameter('user' . $index, $userId);
        }

        $qb->setParameter('userCount', count($userIds));

        return $qb->getQuery()->getOneOrNullResult();
    }

    /**
     * Find user's chat rooms for a specific product.
     * Returns all rooms where user is participant for given product.
     * Excludes rooms where the user has soft-deleted their participation.
     *
     * @return ChatRoomV2[]
     */
    public function findByUserAndProduct(User $user, int $productId): array
    {
        return $this->createQueryBuilder('cr')
            ->innerJoin('cr.participants', 'p')
            ->where('p.user = :user')
            ->andWhere('p.deletedAt IS NULL')
            ->andWhere('cr.productId = :productId')
            ->setParameter('user', $user)
            ->setParameter('productId', $productId)
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
