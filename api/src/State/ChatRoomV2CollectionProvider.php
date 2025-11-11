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
        return $this->chatRoomV2Repository->findAccessibleByUser($user);
    }
}
