<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\DTO\ProductV2;
use App\Service\ProductMockServiceInterface;

/**
 * ProductV2Provider - State provider for product resources
 *
 * Provides product data from mock service for API Platform operations.
 * Follows Single Responsibility: Only handles API state provisioning.
 */
final class ProductV2Provider implements ProviderInterface
{
    public function __construct(
        private readonly ProductMockServiceInterface $productMockService
    ) {
    }

    /**
     * @return ProductV2|ProductV2[]|null
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): object|array|null
    {
        // GetCollection: Return all products
        if (empty($uriVariables['id'])) {
            return $this->productMockService->findAll();
        }

        // Get: Return single product by ID
        $productId = (int) $uriVariables['id'];

        return $this->productMockService->findById($productId);
    }
}
