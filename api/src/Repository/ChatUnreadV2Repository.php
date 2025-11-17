<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatParticipantUnreadV2;
use App\Entity\ChatParticipantV2;
use App\Entity\User;
use App\Entity\ChatRoomV2;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChatParticipantUnreadV2>
 */
class ChatUnreadV2Repository extends ServiceEntityRepository implements ChatUnreadV2RepositoryInterface
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChatParticipantUnreadV2::class);
    }

    public function incrementUnread(ChatParticipantV2 $participant): void
    {
        $unread = $participant->getUnread();
        if (!$unread) {
            $unread = new ChatParticipantUnreadV2();
            $unread->setChatParticipant($participant);
            $this->getEntityManager()->persist($unread);
        }
        $unread->setUnreadCount($unread->getUnreadCount() + 1);
        $this->getEntityManager()->flush();
    }

    public function resetUnread(ChatParticipantV2 $participant): void
    {
        $unread = $participant->getUnread();
        if ($unread) {
            $unread->setUnreadCount(0);
            $unread->setLastReadAt(new \DateTimeImmutable());
            $this->getEntityManager()->flush();
        }
    }

    /**
     * @return array{roomId: int, unreadCount: int}[]
     */
    public function findChatRoomsWithUnreadCounts(User $user): array
    {
        $em = $this->getEntityManager();
        $qb = $em->createQueryBuilder()
            ->select('r.id as roomId', 'SUM(u.unreadCount) as unreadCount')
            ->from(ChatParticipantUnreadV2::class, 'u')
            ->innerJoin('u.chatParticipant', 'p')
            ->innerJoin('p.chatRoom', 'r')
            ->where('p.user = :user')
            ->groupBy('r.id')
            ->setParameter('user', $user);

        return $qb->getQuery()->getResult();
    }
}
