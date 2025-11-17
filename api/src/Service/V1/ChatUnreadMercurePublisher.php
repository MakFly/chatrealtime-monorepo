<?php

declare(strict_types=1);

namespace App\Service\V1;

use App\Entity\ChatRoom;
use App\Entity\User;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

/**
 * Publishes unread count updates via Mercure
 */
class ChatUnreadMercurePublisher
{
    public function __construct(
        private readonly HubInterface $mercureHub,
        private readonly ChatUnreadV1Service $unreadService,
        private readonly \Doctrine\ORM\EntityManagerInterface $entityManager
    ) {
    }

    /**
     * Publish unread counts for all participants of a room
     *
     * @param ChatRoom $room The room to publish for
     * @param User|null $excludeUser Optional user to exclude (e.g., the message author)
     */
    public function publishUnreadCountsForRoom(ChatRoom $room, ?User $excludeUser = null): void
    {
        error_log(sprintf('[ChatUnreadMercurePublisher] Publishing for room ID: %d with %d participants',
            $room->getId(), count($room->getParticipants())));

        if ($excludeUser) {
            error_log(sprintf('[ChatUnreadMercurePublisher] Excluding user ID: %d from notifications', $excludeUser->getId()));
        }

        foreach ($room->getParticipants() as $participant) {
            $user = $participant->getUser();

            // Skip the excluded user (e.g., message author)
            if ($excludeUser && $user->getId() === $excludeUser->getId()) {
                error_log(sprintf('[ChatUnreadMercurePublisher] ⏭️  Skipping user ID: %d (excluded)', $user->getId()));
                continue;
            }

            error_log(sprintf('[ChatUnreadMercurePublisher] Publishing to user ID: %d', $user->getId()));
            $this->publishUnreadCountForUser($user, $room);
        }

        error_log('[ChatUnreadMercurePublisher] ✅ All publications sent');
    }

    /**
     * Publish unread count for a specific user and room
     */
    public function publishUnreadCountForUser(User $user, ChatRoom $room): void
    {
        $unreadCounts = $this->unreadService->getUnreadCountsForUser($user);

        error_log(sprintf('[ChatUnreadMercurePublisher] User %d has %d rooms with unread counts',
            $user->getId(), count($unreadCounts)));

        // Find unreadCount for this room
        $unreadCount = 0;
        foreach ($unreadCounts as $unreadData) {
            if ($unreadData['roomId'] === $room->getId()) {
                $unreadCount = $unreadData['unreadCount'];
                break;
            }
        }

        error_log(sprintf('[ChatUnreadMercurePublisher] Room %d -> User %d: unreadCount = %d',
            $room->getId(), $user->getId(), $unreadCount));

        // Get the last message content for preview using DQL
        $lastMessage = $this->entityManager->createQuery(
            'SELECT m FROM App\Entity\Message m
             WHERE m.chatRoom = :room
             ORDER BY m.createdAt DESC'
        )
        ->setParameter('room', $room)
        ->setMaxResults(1)
        ->getOneOrNullResult();

        $lastMessagePreview = $lastMessage ? $lastMessage->getContent() : null;

        error_log(sprintf('[ChatUnreadMercurePublisher] Last message preview: %s',
            $lastMessagePreview ? substr($lastMessagePreview, 0, 50) : 'null'));

        // Publish to user-specific topic
        $topic = sprintf('/user/%d/unread', $user->getId());

        $payload = json_encode([
            'roomId' => $room->getId(),
            'userId' => $user->getId(),
            'unreadCount' => $unreadCount,
            'lastMessagePreview' => $lastMessagePreview,
            'timestamp' => (new \DateTimeImmutable())->format(\DateTimeInterface::ATOM),
        ], JSON_THROW_ON_ERROR);

        error_log(sprintf('[ChatUnreadMercurePublisher] 📡 Publishing to topic: %s with payload: %s',
            $topic, $payload));

        $update = new Update(
            $topic,
            $payload,
            private: true // Private update for the user
        );

        $this->mercureHub->publish($update);
        error_log('[ChatUnreadMercurePublisher] ✅ Publish completed');
    }
}
