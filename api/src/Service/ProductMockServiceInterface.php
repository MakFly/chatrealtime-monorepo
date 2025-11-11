<?php

declare(strict_types=1);

namespace App\Service;

use App\DTO\ProductV2;

/**
 * ProductMockServiceInterface - Contract for product data access
 *
 * Interface segregation: Only methods needed for product retrieval.
 * In real implementation, this would be ProductRepositoryInterface.
 */
interface ProductMockServiceInterface
{
    /**
     * @return ProductV2[]
     */
    public function findAll(): array;

    public function findById(int $id): ?ProductV2;

    /**
     * @return ProductV2[]
     */
    public function findByCategory(string $category): array;

    /**
     * @return ProductV2[]
     */
    public function findBySeller(int $sellerId): array;
}
