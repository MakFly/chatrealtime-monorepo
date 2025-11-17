<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\User;
use App\Repository\ChatRoomRepository;
use App\Repository\UserRepository;
use App\Service\V1\ChatUnreadV1Service;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * ChatRoom Collection Provider.
 *
 * Filters chat rooms to return:
 * - Rooms where the current user is a participant (private/group)
 * - All public rooms (auto-joined for all authenticated users)
 * - Enriches each room with unreadCount for the current user
 */
final class ChatRoomCollectionProvider implements ProviderInterface
{
    public function __construct(
        private readonly ChatRoomRepository $chatRoomRepository,
        private readonly UserRepository $userRepository,
        private readonly Security $security,
        private readonly ChatUnreadV1Service $unreadService,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        $user = $this->security->getUser();

        if (!$user instanceof User || !$user->getId()) {
            return [];
        }

        // Reload user from database to ensure it's a managed entity
        // This is important for tests where the security user might be detached
        $user = $this->userRepository->find($user->getId());

        if (!$user instanceof User) {
            return [];
        }

        // Return chat rooms accessible by user:
        // - Where user is a participant (private/group)
        // - All public rooms (auto-join)
        $rooms = $this->chatRoomRepository->findAccessibleByUser($user);

        // Get unread counts for all rooms for this user
        $unreadCounts = $this->unreadService->getUnreadCountsForUser($user);

        // Create a map of roomId => unreadCount for quick lookup
        $unreadMap = [];
        foreach ($unreadCounts as $unreadData) {
            $unreadMap[$unreadData['roomId']] = $unreadData['unreadCount'];
        }

        // Enrich each room with its unreadCount
        foreach ($rooms as $room) {
            $roomId = $room->getId();
            $unreadCount = $unreadMap[$roomId] ?? 0;
            $room->setUnreadCount($unreadCount);
        }

        return $rooms;
    }
}
