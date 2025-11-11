<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\ChatRoomV2;
use App\Entity\User;

/**
 * ProductChatServiceInterface - Contract for product-based chat room operations.
 *
 * Interface segregation: Only methods needed for product chat logic.
 */
interface ProductChatServiceInterface
{
    /**
     * Find or create a chat room for a product between buyer and seller.
     */
    public function findOrCreateProductRoom(int $productId, User $buyer, int $sellerId): ChatRoomV2;

    /**
     * Get all chat rooms for a specific product.
     *
     * @return ChatRoomV2[]
     */
    public function getRoomsForProduct(int $productId): array;

    /**
     * Get user's chat rooms for a specific product.
     *
     * @return ChatRoomV2[]
     */
    public function getUserRoomsForProduct(User $user, int $productId): array;
}
