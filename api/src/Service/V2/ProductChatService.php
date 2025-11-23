<?php

declare(strict_types=1);

namespace App\Service\V2;

use App\Entity\ChatParticipantV2;
use App\Entity\ChatRoomV2;
use App\Entity\User;
use App\Repository\ChatRoomV2Repository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\BadRequestException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * ProductChatService - Business logic for product-based chat rooms.
 *
 * Handles the creation and retrieval of chat rooms for marketplace products.
 * Implements "find or create" pattern to prevent duplicate rooms.
 */
final class ProductChatService implements ProductChatServiceInterface
{
    public function __construct(
        private readonly ChatRoomV2Repository $chatRoomV2Repository,
        private readonly ProductMockServiceInterface $productMockService,
        private readonly EntityManagerInterface $entityManager,
        private readonly HubInterface $mercureHub,
        private readonly SerializerInterface $serializer,
    ) {
    }

    /**
     * Find or create a chat room for a product between buyer and seller.
     *
     * @param int $productId
     * @param User $buyer The user initiating the chat
     * @param int $sellerId The product seller's user ID
     * @return ChatRoomV2
     *
     * @throws NotFoundHttpException if product doesn't exist
     * @throws BadRequestException if seller doesn't exist or buyer == seller
     */
    public function findOrCreateProductRoom(int $productId, User $buyer, int $sellerId): ChatRoomV2
    {
        // 1. Validate product exists
        $product = $this->productMockService->findById($productId);
        if ($product === null) {
            throw new NotFoundHttpException(sprintf('Product with ID %d not found', $productId));
        }

        // 2. Validate seller exists and is not the buyer
        $seller = $this->entityManager->getRepository(User::class)->find($sellerId);
        if ($seller === null) {
            throw new NotFoundHttpException(sprintf('Seller with ID %d not found', $sellerId));
        }

        if ($buyer->getId() === $seller->getId()) {
            throw new BadRequestException('Cannot create chat room with yourself');
        }

        // 3. Check if room already exists for this product + participants
        $existingRoom = $this->chatRoomV2Repository->findExistingRoomForProduct(
            $productId,
            [$buyer->getId(), $seller->getId()]
        );

        if ($existingRoom !== null) {
            // Restore participation if user previously left (soft-deleted)
            $restored = false;
            foreach ($existingRoom->getParticipants() as $participant) {
                $participantUserId = $participant->getUser()->getId();
                if (
                    ($participantUserId === $buyer->getId() || $participantUserId === $seller->getId()) &&
                    $participant->getDeletedAt() !== null
                ) {
                    $participant->setDeletedAt(null);
                    $restored = true;
                }
            }

            if ($restored) {
                $this->entityManager->flush();
            }

            return $existingRoom;
        }

        // 4. Create new room
        return $this->createProductRoom($product->getTitle(), $productId, $buyer, $seller);
    }

    /**
     * Create a new product chat room with buyer and seller as participants.
     */
    private function createProductRoom(string $productTitle, int $productId, User $buyer, User $seller): ChatRoomV2
    {
        $chatRoom = new ChatRoomV2();
        $chatRoom->setName(sprintf('Chat: %s', $productTitle));
        $chatRoom->setType('direct'); // Product chats are always direct (1-1)
        $chatRoom->setProductId($productId);
        $chatRoom->setProductTitle($productTitle);

        // Add buyer as participant (admin)
        $buyerParticipant = new ChatParticipantV2();
        $buyerParticipant->setUser($buyer);
        $buyerParticipant->setChatRoom($chatRoom);
        $buyerParticipant->setRole('admin'); // Buyer initiates, gets admin
        $chatRoom->addParticipant($buyerParticipant);

        // Add seller as participant (member)
        $sellerParticipant = new ChatParticipantV2();
        $sellerParticipant->setUser($seller);
        $sellerParticipant->setChatRoom($chatRoom);
        $sellerParticipant->setRole('member'); // Seller joins as member
        $chatRoom->addParticipant($sellerParticipant);

        // Persist
        $this->entityManager->persist($chatRoom);
        $this->entityManager->flush();

        // Publish to Mercure for real-time synchronization
        $this->publishToMercure($chatRoom);

        return $chatRoom;
    }

    /**
     * Publish room creation to Mercure for real-time updates.
     *
     * Publishes to user-specific topics for both buyer and seller:
     * - /chat-v2/rooms/user/{buyerId}
     * - /chat-v2/rooms/user/{sellerId}
     *
     * This ensures both participants see the new room in their sidebar immediately.
     */
    private function publishToMercure(ChatRoomV2 $chatRoom): void
    {
        // Serialize room with same groups as API response
        $data = $this->serializer->serialize($chatRoom, 'json', [
            'groups' => ['chatRoomV2:read'],
            'enable_max_depth' => true,
        ]);

        $topics = [];

        // Publish to each participant's personal topic
        foreach ($chatRoom->getParticipants() as $participant) {
            $userId = $participant->getUser()->getId();
            $topics[] = sprintf('/chat-v2/rooms/user/%d', $userId);
        }

        // Debug log
        error_log(sprintf('[ProductChatService] 📤 Publishing room #%d "%s" (product: #%d) to %d topics',
            $chatRoom->getId(),
            $chatRoom->getName(),
            $chatRoom->getProductId(),
            count($topics)
        ));

        // Publish to Mercure
        $update = new Update(
            topics: $topics,
            data: $data,
            private: true, // Only subscribers with valid JWT can receive
        );

        $this->mercureHub->publish($update);

        error_log(sprintf('[ProductChatService] ✅ Mercure publish completed for room #%d', $chatRoom->getId()));
    }

    /**
     * Get all chat rooms for a specific product.
     *
     * @return ChatRoomV2[]
     */
    public function getRoomsForProduct(int $productId): array
    {
        return $this->chatRoomV2Repository->findByProductId($productId);
    }

    /**
     * Get user's chat rooms for a specific product.
     *
     * @return ChatRoomV2[]
     */
    public function getUserRoomsForProduct(User $user, int $productId): array
    {
        return $this->chatRoomV2Repository->findByUserAndProduct($user, $productId);
    }
}
