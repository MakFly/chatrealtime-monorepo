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
 * Filters chat rooms to only return those where the current user is a participant.
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

        // Return only chat rooms where user is a participant
        return $this->chatRoomRepository->findByParticipant($user);
    }
}
