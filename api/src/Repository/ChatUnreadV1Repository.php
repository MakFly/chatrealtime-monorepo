<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatParticipantUnreadV1;
use App\Entity\ChatParticipant;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChatParticipantUnreadV1>
 */
class ChatUnreadV1Repository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChatParticipantUnreadV1::class);
    }

    public function incrementUnread(ChatParticipant $participant): void
    {
        $unread = $participant->getUnread();
        $userId = $participant->getUser()->getId();
        $roomId = $participant->getChatRoom()->getId();

        if (!$unread) {
            error_log(sprintf('[ChatUnreadV1Repository] ⚠️  No unread record exists for user %d in room %d - creating new one',
                $userId, $roomId));
            $unread = new ChatParticipantUnreadV1();
            $unread->setChatParticipant($participant);
            $this->getEntityManager()->persist($unread);
        }

        // ✅ Don't increment if user recently marked the room as read (within last 15 seconds)
        // This prevents false unread counts when user is actively viewing the room
        // The frontend sends a heartbeat every 10 seconds, so 15s gives enough margin
        $lastReadAt = $unread->getLastReadAt();

        error_log(sprintf('[ChatUnreadV1Repository] 🔍 Checking lastReadAt for user %d in room %d: %s',
            $userId, $roomId, $lastReadAt ? $lastReadAt->format('Y-m-d H:i:s') : 'NULL'));

        if ($lastReadAt) {
            $now = new \DateTimeImmutable();
            $secondsSinceRead = $now->getTimestamp() - $lastReadAt->getTimestamp();

            error_log(sprintf('[ChatUnreadV1Repository] ⏱️  User %d read %d seconds ago (threshold: 15s)',
                $userId, $secondsSinceRead));

            if ($secondsSinceRead < 15) {
                error_log(sprintf('[ChatUnreadV1Repository] ⏭️  Skipping increment for user %d (read %d seconds ago)',
                    $userId, $secondsSinceRead));
                // Don't increment, user is actively reading
                return;
            }
        } else {
            error_log(sprintf('[ChatUnreadV1Repository] ⚠️  lastReadAt is NULL for user %d - will increment',
                $userId));
        }

        $currentCount = $unread->getUnreadCount();
        $unread->setUnreadCount($currentCount + 1);
        $this->getEntityManager()->flush();

        error_log(sprintf('[ChatUnreadV1Repository] ➕ Incremented unread count for user %d in room %d: %d -> %d',
            $userId, $roomId, $currentCount, $currentCount + 1));
    }

    public function resetUnread(ChatParticipant $participant): void
    {
        $userId = $participant->getUser()->getId();
        $roomId = $participant->getChatRoom()->getId();

        $unread = $participant->getUnread();
        if (!$unread) {
            error_log(sprintf('[ChatUnreadV1Repository] 📝 Creating new unread record for user %d in room %d',
                $userId, $roomId));
            // Create unread record if it doesn't exist
            $unread = new ChatParticipantUnreadV1();
            $unread->setChatParticipant($participant);
            $unread->setUnreadCount(0);
            $this->getEntityManager()->persist($unread);
        } else {
            error_log(sprintf('[ChatUnreadV1Repository] 📝 Resetting existing unread record for user %d in room %d (was: %d)',
                $userId, $roomId, $unread->getUnreadCount()));
            $unread->setUnreadCount(0);
        }

        // Always update lastReadAt timestamp
        $now = new \DateTimeImmutable();
        $unread->setLastReadAt($now);
        $this->getEntityManager()->flush();

        error_log(sprintf('[ChatUnreadV1Repository] ✅ Reset unread for user %d in room %d, lastReadAt set to %s',
            $userId, $roomId, $now->format('Y-m-d H:i:s')));
    }

    /**
     * @return array{roomId: int, unreadCount: int}[]
     */
    public function findChatRoomsWithUnreadCounts(User $user): array
    {
        $em = $this->getEntityManager();
        $qb = $em->createQueryBuilder()
            ->select('r.id as roomId', 'u.unreadCount as unreadCount')
            ->from(ChatParticipantUnreadV1::class, 'u')
            ->innerJoin('u.chatParticipant', 'p')
            ->innerJoin('p.chatRoom', 'r')
            ->where('p.user = :user')
            ->andWhere('u.unreadCount > 0')
            ->setParameter('user', $user);

        return $qb->getQuery()->getResult();
    }
}
