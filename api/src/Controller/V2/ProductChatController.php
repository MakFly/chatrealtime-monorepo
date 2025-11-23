<?php

declare(strict_types=1);

namespace App\Controller\V2;

use App\Entity\User;
use App\Service\V2\ProductChatServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;

#[AsController]
#[Route('/api/v2')]
class ProductChatController extends AbstractController
{
    public function __construct(
        private readonly ProductChatServiceInterface $productChatService,
        private readonly SerializerInterface $serializer,
        private readonly \App\Service\V2\ChatUnreadV2ServiceInterface $unreadService
    ) {
    }

    /**
     * Find or create a chat room for a product.
     *
     * POST /api/v2/products/{productId}/chat
     * Body: { "sellerId": 123 }
     *
     * Returns the existing room or creates a new one.
     */
    #[Route('/products/{productId}/chat', name: 'product_chat_create', methods: ['POST'])]
    #[IsGranted('ROLE_USER')]
    public function createOrFindChat(int $productId, Request $request): JsonResponse
    {
        /** @var User $buyer */
        $buyer = $this->getUser();

        $data = json_decode($request->getContent(), true);
        $sellerId = $data['sellerId'] ?? null;

        if ($sellerId === null) {
            return $this->json(['error' => 'sellerId is required'], 400);
        }

        $chatRoom = $this->productChatService->findOrCreateProductRoom($productId, $buyer, (int) $sellerId);

        // Populate unread count (likely 0 for new room, but good for existing)
        $counts = $this->unreadService->getUnreadCountsForUser($buyer);
        $count = 0;
        foreach ($counts as $c) {
            if ($c['roomId'] === $chatRoom->getId()) {
                $count = $c['unreadCount'];
                break;
            }
        }
        $chatRoom->setUnreadCount($count);

        // Serialize with chatRoomV2:read groups
        $serialized = $this->serializer->serialize($chatRoom, 'json', [
            'groups' => ['chatRoomV2:read'],
            'enable_max_depth' => true,
        ]);

        return new JsonResponse($serialized, 200, [], true);
    }

    /**
     * Get all chat rooms for a product.
     *
     * GET /api/v2/products/{productId}/chats
     */
    #[Route('/products/{productId}/chats', name: 'product_chats_list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function listProductChats(int $productId): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $chatRooms = $this->productChatService->getUserRoomsForProduct($user, $productId);

        // Populate unread counts
        $unreadCounts = $this->unreadService->getUnreadCountsForUser($user);
        $unreadMap = [];
        foreach ($unreadCounts as $count) {
            $unreadMap[$count['roomId']] = $count['unreadCount'];
        }

        foreach ($chatRooms as $room) {
            $roomId = $room->getId();
            $room->setUnreadCount($unreadMap[$roomId] ?? 0);
        }

        $serialized = $this->serializer->serialize($chatRooms, 'json', [
            'groups' => ['chatRoomV2:read'],
            'enable_max_depth' => true,
        ]);

        return new JsonResponse($serialized, 200, [], true);
    }
}
