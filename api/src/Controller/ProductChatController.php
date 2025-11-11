<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use App\Service\ProductChatServiceInterface;
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
        private readonly SerializerInterface $serializer
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

        $serialized = $this->serializer->serialize($chatRooms, 'json', [
            'groups' => ['chatRoomV2:read'],
            'enable_max_depth' => true,
        ]);

        return new JsonResponse($serialized, 200, [], true);
    }
}
