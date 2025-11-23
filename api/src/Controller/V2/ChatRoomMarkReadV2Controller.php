<?php

declare(strict_types=1);

namespace App\Controller\V2;

use App\Entity\ChatRoomV2;
use App\Entity\User;
use App\Repository\ChatParticipantV2Repository;
use App\Service\V2\ChatUnreadV2ServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;

#[AsController]
class ChatRoomMarkReadV2Controller extends AbstractController
{
    public function __construct(
        private readonly ChatUnreadV2ServiceInterface $unreadService,
        private readonly ChatParticipantV2Repository $participantRepository
    ) {
    }

    public function __invoke(ChatRoomV2 $data): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $participant = $this->participantRepository->findOneBy([
            'chatRoom' => $data,
            'user' => $user,
        ]);

        if ($participant) {
            $this->unreadService->resetUnread($participant);
        }

        return new JsonResponse(['status' => 'ok']);
    }
}

