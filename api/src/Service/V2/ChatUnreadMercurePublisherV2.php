<?php

declare(strict_types=1);

namespace App\Service\V2;

use App\Entity\ChatRoomV2;
use App\Entity\User;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

/**
 * Service to publish unread count updates via Mercure for chat v2.
 *
 * Publishes to /chat-v2/unread/user/{userId} topic with room-specific unread counts.
 */
final class ChatUnreadMercurePublisherV2
{
    public function __construct(
        private readonly HubInterface $hub,
        private readonly ChatUnreadV2ServiceInterface $unreadService,
    ) {
    }

    /**
     * Publish unread count updates to all participants in a room (except excluded user).
     *
     * @param ChatRoomV2 $room The chat room
     * @param User|null $excludeUser User to exclude (typically the message author)
     */
    public function publishUnreadCountsForRoom(ChatRoomV2 $room, ?User $excludeUser = null): void
    {
        foreach ($room->getParticipants() as $participant) {
            // Skip excluded user (message author)
            if ($excludeUser && $participant->getUser() === $excludeUser) {
                continue;
            }

            // Skip soft-deleted participants
            if ($participant->isDeleted()) {
                continue;
            }

            $this->publishUnreadCountForUser($participant->getUser(), $room);
        }
    }

    /**
     * Publish unread count update for a specific user and room.
     *
     * @param User $user The user to notify
     * @param ChatRoomV2 $room The chat room
     */
    public function publishUnreadCountForUser(User $user, ChatRoomV2 $room): void
    {
        $unreadCounts = $this->unreadService->getUnreadCountsForUser($user);

        // Find unread count for this room
        $roomUnread = null;
        foreach ($unreadCounts as $unread) {
            if ($unread['roomId'] === $room->getId()) {
                $roomUnread = $unread;
                break;
            }
        }

        $data = [
            'roomId' => $room->getId(),
            'userId' => $user->getId(),
            'unreadCount' => $roomUnread['unreadCount'] ?? 0,
            'timestamp' => (new \DateTimeImmutable())->format('c'),
        ];

        $topic = sprintf('/chat-v2/unread/user/%d', $user->getId());

        $update = new Update(
            $topic,
            json_encode($data),
            true // private
        );

        try {
            $this->hub->publish($update);
            error_log(sprintf('[ChatUnreadMercurePublisherV2] 📨 Published unread count to user #%d for room #%d: %d unread', $user->getId(), $room->getId(), $data['unreadCount']));
        } catch (\Exception $e) {
            error_log(sprintf('[ChatUnreadMercurePublisherV2] ❌ Failed to publish: %s', $e->getMessage()));
        }
    }
}
