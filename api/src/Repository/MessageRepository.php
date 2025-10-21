<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatRoom;
use App\Entity\Message;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Message>
 */
class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    /**
     * Find messages for a chat room with pagination.
     *
     * @return Message[]
     */
    public function findByChatRoom(ChatRoom $chatRoom, int $page = 1, int $limit = 50): array
    {
        return $this->createQueryBuilder('m')
            ->where('m.chatRoom = :chatRoom')
            ->setParameter('chatRoom', $chatRoom)
            ->orderBy('m.createdAt', 'DESC')
            ->setFirstResult(($page - 1) * $limit)
            ->setMaxResults($limit)
            ->getQuery()
            ->getResult();
    }

    /**
     * Count total messages in a chat room.
     */
    public function countByChatRoom(ChatRoom $chatRoom): int
    {
        return (int) $this->createQueryBuilder('m')
            ->select('COUNT(m.id)')
            ->where('m.chatRoom = :chatRoom')
            ->setParameter('chatRoom', $chatRoom)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
