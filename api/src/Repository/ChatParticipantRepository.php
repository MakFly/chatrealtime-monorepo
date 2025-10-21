<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChatParticipant>
 */
class ChatParticipantRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChatParticipant::class);
    }

    /**
     * Find participant by user and chat room.
     */
    public function findByUserAndRoom(User $user, ChatRoom $chatRoom): ?ChatParticipant
    {
        return $this->createQueryBuilder('cp')
            ->where('cp.user = :user')
            ->andWhere('cp.chatRoom = :chatRoom')
            ->setParameter('user', $user)
            ->setParameter('chatRoom', $chatRoom)
            ->getQuery()
            ->getOneOrNullResult();
    }

    /**
     * Check if user is participant in chat room.
     */
    public function isUserParticipant(User $user, ChatRoom $chatRoom): bool
    {
        return $this->findByUserAndRoom($user, $chatRoom) !== null;
    }
}
