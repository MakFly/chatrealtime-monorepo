<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ChatRoomV2;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * Service for restoring soft-deleted chat participants.
 *
 * When a user receives a new message in a conversation they deleted,
 * this service automatically restores their participation so they can
 * see the new messages.
 */
final class ChatParticipantRestoreService
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly HubInterface $mercureHub,
        private readonly SerializerInterface $serializer,
        private readonly LoggerInterface $logger,
    ) {
    }

    /**
     * Restore all soft-deleted participants in a chat room.
     *
     * This is called when a new message is created to ensure all participants
     * can see the message, even if they previously deleted the conversation.
     *
     * @param ChatRoomV2 $room The chat room to restore participants for
     * @return int Number of participants restored
     */
    public function restoreDeletedParticipants(ChatRoomV2 $room): int
    {
        $restoredCount = 0;
        $restoredUserIds = [];

        foreach ($room->getParticipants() as $participant) {
            if ($participant->isDeleted()) {
                $userId = $participant->getUser()->getId();
                $participant->restore();
                $restoredCount++;
                $restoredUserIds[] = $userId;

                $this->logger->info('[ChatParticipantRestore] Restored participant', [
                    'room_id' => $room->getId(),
                    'room_name' => $room->getName(),
                    'user_id' => $userId,
                    'product_id' => $room->getProductId(),
                ]);
            }
        }

        if ($restoredCount > 0) {
            // Persist changes
            $this->entityManager->flush();

            // Publish to Mercure for real-time sidebar updates
            $this->publishRoomRestoration($room, $restoredUserIds);

            $this->logger->info('[ChatParticipantRestore] Batch restore completed', [
                'room_id' => $room->getId(),
                'restored_count' => $restoredCount,
                'restored_users' => $restoredUserIds,
            ]);
        }

        return $restoredCount;
    }

    /**
     * Publish room restoration to Mercure for real-time updates.
     *
     * Publishes the restored room to each restored user's personal topic
     * so the conversation reappears in their sidebar immediately.
     *
     * @param ChatRoomV2 $room The restored room
     * @param array<int> $restoredUserIds IDs of users who were restored
     */
    private function publishRoomRestoration(ChatRoomV2 $room, array $restoredUserIds): void
    {
        // Serialize room with same groups as API response
        $data = $this->serializer->serialize($room, 'json', [
            'groups' => ['chatRoomV2:read'],
            'enable_max_depth' => true,
        ]);

        $topics = [];

        // Publish to each restored user's personal topic
        foreach ($restoredUserIds as $userId) {
            $topics[] = sprintf('/chat-v2/rooms/user/%d', $userId);
        }

        if (empty($topics)) {
            return;
        }

        $this->logger->info('[ChatParticipantRestore] Publishing room restoration', [
            'room_id' => $room->getId(),
            'topics_count' => count($topics),
            'topics' => $topics,
        ]);

        // Publish to Mercure
        $update = new Update(
            topics: $topics,
            data: $data,
            private: true, // Only subscribers with valid JWT can receive
        );

        $this->mercureHub->publish($update);
    }
}
