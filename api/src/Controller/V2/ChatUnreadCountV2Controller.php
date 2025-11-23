<?php

declare(strict_types=1);

namespace App\Controller\V2;

use App\Entity\User;
use App\Service\V2\ChatUnreadV2ServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
#[Route('/api/v2')]
class ChatUnreadCountV2Controller extends AbstractController
{
    public function __construct(
        private readonly ChatUnreadV2ServiceInterface $unreadService
    ) {
    }

    #[Route('/chat/unread', name: 'chat_unread_count_v2', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function __invoke(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $counts = $this->unreadService->getUnreadCountsForUser($user);

        return new JsonResponse($counts);
    }
}

