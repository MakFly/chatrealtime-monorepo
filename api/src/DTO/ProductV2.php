<?php

declare(strict_types=1);

namespace App\DTO;

use App\Entity\User;
use DateTimeImmutable;

/**
 * ProductV2 DTO - Data Transfer Object for marketplace products
 *
 * This is NOT a Doctrine entity. It's used with mock data only.
 * Exposed via ProductV2Controller at /api/v2/products
 */
final class ProductV2
{
    public function __construct(
        private int $id,
        private string $title,
        private string $description,
        private float $price,
        private string $category,
        private string $location,
        private array $images,
        private string $condition,
        private DateTimeImmutable $createdAt,
        private ?User $seller = null,
    ) {
    }

    public function getId(): int
    {
        return $this->id;
    }

    public function getTitle(): string
    {
        return $this->title;
    }

    public function getDescription(): string
    {
        return $this->description;
    }

    public function getPrice(): float
    {
        return $this->price;
    }

    public function getCategory(): string
    {
        return $this->category;
    }

    public function getLocation(): string
    {
        return $this->location;
    }

    public function getImages(): array
    {
        return $this->images;
    }

    public function getCondition(): string
    {
        return $this->condition;
    }

    public function getCreatedAt(): DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getSeller(): ?User
    {
        return $this->seller;
    }

    /**
     * Serialize to array for API responses
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'price' => $this->price,
            'category' => $this->category,
            'location' => $this->location,
            'images' => $this->images,
            'condition' => $this->condition,
            'createdAt' => $this->createdAt->format('c'),
            'seller' => $this->seller ? [
                'id' => $this->seller->getId(),
                'email' => $this->seller->getEmail(),
                'name' => $this->seller->getName(),
                'picture' => $this->seller->getPicture(),
            ] : null,
        ];
    }
}
