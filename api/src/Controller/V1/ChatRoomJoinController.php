<?php

declare(strict_types=1);

namespace App\Controller\V1;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

/**
 * Controller for joining public chat rooms.
 *
 * Automatically adds the authenticated user as a participant of a public room
 * if they are not already a participant.
 */
#[AsController]
#[Route('/api/v1')]
class ChatRoomJoinController extends AbstractController
{
    public function __construct(
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    #[Route('/chat_rooms/{id}/join', name: 'api_chat_rooms_join', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function join(ChatRoom $chatRoom): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        // Only public rooms can be auto-joined
        if ($chatRoom->getType() !== 'public') {
            return $this->json([
                'error' => 'Only public rooms can be joined automatically',
            ], Response::HTTP_FORBIDDEN);
        }

        // Check if user is already a participant
        foreach ($chatRoom->getParticipants() as $participant) {
            if ($participant->getUser() === $user) {
                return $this->json([
                    'message' => 'Already a participant',
                    'participant_count' => $chatRoom->getParticipants()->count(),
                ], Response::HTTP_OK);
            }
        }

        // Add user as participant with 'member' role
        $participant = new ChatParticipant();
        $participant->setUser($user);
        $participant->setChatRoom($chatRoom);
        $participant->setRole('member'); // Regular member, not admin

        $chatRoom->addParticipant($participant);

        $this->entityManager->persist($participant);
        $this->entityManager->flush();

        return $this->json([
            'message' => 'Successfully joined the room',
            'participant_count' => $chatRoom->getParticipants()->count(),
        ], Response::HTTP_OK);
    }
}
