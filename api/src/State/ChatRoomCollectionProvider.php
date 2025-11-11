<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\User;
use App\Repository\ChatRoomRepository;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * ChatRoom Collection Provider.
 *
 * Filters chat rooms to return:
 * - Rooms where the current user is a participant (private/group)
 * - All public rooms (auto-joined for all authenticated users)
 */
final class ChatRoomCollectionProvider implements ProviderInterface
{
    public function __construct(
        private readonly ChatRoomRepository $chatRoomRepository,
        private readonly Security $security,
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
        return $this->chatRoomRepository->findAccessibleByUser($user);
    }
}
