<?php

declare(strict_types=1);

namespace App\Controller\V2;

use App\Service\V2\ProductMockServiceInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * ProductV2Controller - REST endpoints for marketplace products
 *
 * Exposes mock product data for marketplace V2.
 * Public access - no authentication required.
 */
#[AsController]
#[Route('/api/v2/products')]
final class ProductV2Controller extends AbstractController
{
    public function __construct(
        private readonly ProductMockServiceInterface $productMockService,
        private readonly SerializerInterface $serializer,
    ) {
    }

    /**
     * Get all products or filter by category
     * Supports query parameter: ?category=Electronics
     *
     * @return JsonResponse Collection of products with hydra format
     */
    #[Route('', name: 'products_list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $category = $request->query->get('category');

        // Filter by category if provided
        if ($category) {
            $products = $this->productMockService->findByCategory($category);
            $contextId = "/api/v2/products?category={$category}";
        } else {
            $products = $this->productMockService->findAll();
            $contextId = '/api/v2/products';
        }

        // Convert DTOs to arrays
        $productsData = array_map(
            fn($product) => $product->toArray(),
            $products
        );

        // Return in Hydra collection format for API Platform compatibility
        return $this->json([
            '@context' => '/api/contexts/ProductV2',
            '@id' => $contextId,
            '@type' => 'hydra:Collection',
            'hydra:totalItems' => count($productsData),
            'hydra:member' => $productsData,
        ]);
    }

    /**
     * Get a single product by ID
     *
     * @return JsonResponse Product data or 404
     */
    #[Route('/{id}', name: 'product_get', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function get(int $id): JsonResponse
    {
        $product = $this->productMockService->findById($id);

        if (!$product) {
            return $this->json(
                ['error' => 'Product not found'],
                Response::HTTP_NOT_FOUND
            );
        }

        // Return single product in Hydra format
        return $this->json([
            '@context' => '/api/contexts/ProductV2',
            '@id' => "/api/v2/products/{$id}",
            '@type' => 'ProductV2',
            ...$product->toArray(),
        ]);
    }
}
