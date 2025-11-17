<?php

declare(strict_types=1);

namespace App\Service\V1;

use App\Entity\ChatParticipant;
use App\Entity\User;
use App\Repository\ChatUnreadV1Repository;

class ChatUnreadV1Service
{
    public function __construct(
        private readonly ChatUnreadV1Repository $unreadRepository
    ) {
    }

    public function incrementUnread(ChatParticipant $participant): void
    {
        $this->unreadRepository->incrementUnread($participant);
    }

    public function resetUnread(ChatParticipant $participant): void
    {
        $this->unreadRepository->resetUnread($participant);
    }

    /**
     * @return array{roomId: int, unreadCount: int}[]
     */
    public function getUnreadCountsForUser(User $user): array
    {
        return $this->unreadRepository->findChatRoomsWithUnreadCounts($user);
    }
}
