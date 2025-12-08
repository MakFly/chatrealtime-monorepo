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

        // Don't increment if user VERY recently marked room as read (within 5 seconds)
        // This prevents false unread counts when user is actively viewing the room
        // Grace period is 5s to work with 3s heartbeat (frontend sends read every 3s)
        // When user leaves room, they stop sending heartbeat, so notifications resume quickly (5s max)
        $lastReadAt = $unread->getLastReadAt();
        if ($lastReadAt) {
            $now = new \DateTimeImmutable();
            $secondsSinceRead = $now->getTimestamp() - $lastReadAt->getTimestamp();

            if ($secondsSinceRead < 5) {
                // Don't increment, user is actively reading (heartbeat still active)
                error_log(sprintf('[ChatUnreadV2Repository] ⏭️  Skipping increment - user read %ds ago (grace period)', $secondsSinceRead));
                return;
            }
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
            ->andWhere('p.deletedAt IS NULL')
            ->groupBy('r.id')
            ->setParameter('user', $user);

        return $qb->getQuery()->getResult();
    }
}
