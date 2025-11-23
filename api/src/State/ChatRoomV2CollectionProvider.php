<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\User;
use App\Repository\ChatRoomV2Repository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * ChatRoomV2 Collection Provider.
 *
 * Filters chat rooms to return:
 * - Rooms where the current user is a participant (private/group)
 * - All public rooms (auto-joined for all authenticated users)
 */
final class ChatRoomV2CollectionProvider implements ProviderInterface
{
    public function __construct(
        private readonly ChatRoomV2Repository $chatRoomV2Repository,
        private readonly Security $security,
        private readonly \App\Service\V2\ChatUnreadV2ServiceInterface $unreadService,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            return [];
        }

        // Return chat rooms accessible by user:
        // - Where user is a participant (private/group)
        // - All public rooms (auto-join)
        $rooms = $this->chatRoomV2Repository->findAccessibleByUser($user);

        // Populate unread counts for each room
        $unreadCounts = $this->unreadService->getUnreadCountsForUser($user);
        
        // Create map for O(1) lookup
        $unreadMap = [];
        foreach ($unreadCounts as $count) {
            $unreadMap[$count['roomId']] = $count['unreadCount'];
        }

        // Assign counts to rooms (virtual property)
        foreach ($rooms as $room) {
            $roomId = $room->getId();
            $room->setUnreadCount($unreadMap[$roomId] ?? 0);
        }

        return $rooms;
    }
}
