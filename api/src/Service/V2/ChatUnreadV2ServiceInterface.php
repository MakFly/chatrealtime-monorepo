<?php

declare(strict_types=1);

namespace App\Service\V2;

use App\Entity\ChatParticipantV2;
use App\Entity\User;

interface ChatUnreadV2ServiceInterface
{
    public function incrementUnread(ChatParticipantV2 $participant): void;

    public function resetUnread(ChatParticipantV2 $participant): void;

    /**
     * @return array{roomId: int, unreadCount: int}[]
     */
    public function getUnreadCountsForUser(User $user): array;
}
