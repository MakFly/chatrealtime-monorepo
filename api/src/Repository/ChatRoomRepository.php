<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatRoom;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChatRoom>
 */
class ChatRoomRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChatRoom::class);
    }

    /**
     * Find all chat rooms where the user is a participant.
     *
     * @return ChatRoom[]
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
     * @return ChatRoom[]
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
     * @return ChatRoom[]
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
}
