<?php

declare(strict_types=1);

namespace App\Controller\V1;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\User;
use App\Service\V1\ChatUnreadV1Service;
use App\Service\V1\ChatUnreadMercurePublisher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1')]
class ChatRoomMarkReadController extends AbstractController
{
    public function __construct(
        private readonly ChatUnreadV1Service $unreadService,
        private readonly ChatUnreadMercurePublisher $mercurePublisher,
        private readonly EntityManagerInterface $entityManager
    ) {
    }

    #[Route('/chat_rooms/{id}/mark-read', name: 'api_chat_room_mark_read', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function markRead(ChatRoom $chatRoom): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        // Find the participant for this user in this room
        $participant = null;
        foreach ($chatRoom->getParticipants() as $p) {
            if ($p->getUser() === $user) {
                $participant = $p;
                break;
            }
        }

        if (!$participant) {
            // ✅ For public rooms, auto-create participant to enable unread tracking
            if ($chatRoom->getType() === 'public') {
                $participant = $this->createParticipantForPublicRoom($user, $chatRoom);
            } else {
                // For private/group rooms, user should be a participant already
                return new JsonResponse([
                    'message' => 'Room marked as read (no participant record)',
                    'roomId' => $chatRoom->getId(),
                    'unreadCount' => 0,
                ]);
            }
        }

        // Reset unread count and update lastReadAt timestamp
        $this->unreadService->resetUnread($participant);

        // Publish update via Mercure
        $this->mercurePublisher->publishUnreadCountForUser($user, $chatRoom);

        return new JsonResponse([
            'message' => 'Room marked as read',
            'roomId' => $chatRoom->getId(),
            'unreadCount' => 0,
        ]);
    }

    /**
     * ✅ Auto-create participant for public rooms to enable unread tracking
     */
    private function createParticipantForPublicRoom(User $user, ChatRoom $room): ChatParticipant
    {
        $participant = new ChatParticipant();
        $participant->setUser($user);
        $participant->setChatRoom($room);
        $participant->setRole('member');

        $this->entityManager->persist($participant);
        $this->entityManager->flush();

        error_log(sprintf('[ChatRoomMarkReadController] ✅ Auto-created participant for user %d in public room %d',
            $user->getId(), $room->getId()));

        return $participant;
    }
}
