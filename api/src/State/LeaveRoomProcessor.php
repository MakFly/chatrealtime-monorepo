<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\ChatRoomV2;
use App\Repository\ChatParticipantV2Repository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/**
 * Processor for leaving a chat room (soft delete).
 * Marks the current user's participation as deleted without affecting other participants.
 */
final class LeaveRoomProcessor implements ProcessorInterface
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
        private readonly ChatParticipantV2Repository $participantRepository,
        private readonly Security $security,
    ) {
    }

    /**
     * @param ChatRoomV2 $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        if (!$data instanceof ChatRoomV2) {
            throw new BadRequestHttpException('Expected ChatRoomV2 entity');
        }

        $currentUser = $this->security->getUser();
        if ($currentUser === null) {
            throw new BadRequestHttpException('User not authenticated');
        }

        // Find the participant record for the current user
        $participant = $this->participantRepository->findOneBy([
            'chatRoom' => $data,
            'user' => $currentUser,
        ]);

        if ($participant === null) {
            throw new NotFoundHttpException('You are not a participant in this room');
        }

        // Check if already deleted
        if ($participant->isDeleted()) {
            throw new BadRequestHttpException('You have already left this room');
        }

        // Soft delete the participant
        $participant->softDelete();
        $this->entityManager->flush();

        // Return the room (participant will be excluded from serialization due to repository filter)
        return $data;
    }
}
