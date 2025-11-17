<?php

declare(strict_types=1);

namespace App\Service\V2;

use App\Entity\ChatParticipantV2;
use App\Entity\User;
use App\Repository\ChatUnreadV2RepositoryInterface;

class ChatUnreadV2Service implements ChatUnreadV2ServiceInterface
{
    public function __construct(
        private readonly ChatUnreadV2RepositoryInterface $unreadRepository
    ) {
    }

    public function incrementUnread(ChatParticipantV2 $participant): void
    {
        $this->unreadRepository->incrementUnread($participant);
    }

    public function resetUnread(ChatParticipantV2 $participant): void
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
