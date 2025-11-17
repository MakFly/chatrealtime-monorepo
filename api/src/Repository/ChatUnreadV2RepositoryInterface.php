<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatParticipantV2;
use App\Entity\User;

interface ChatUnreadV2RepositoryInterface
{
    public function incrementUnread(ChatParticipantV2 $participant): void;

    public function resetUnread(ChatParticipantV2 $participant): void;

    /**
     * @return array{roomId: int, unreadCount: int}[]
     */
    public function findChatRoomsWithUnreadCounts(User $user): array;
}
