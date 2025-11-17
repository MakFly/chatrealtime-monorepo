<?php

declare(strict_types=1);

namespace App\Service\V2;

use App\DTO\ProductV2;
use App\Repository\UserRepository;
use DateTimeImmutable;

/**
 * ProductMockService - Provides mock product data for marketplace
 *
 * This service returns hard-coded mock products for development/demo.
 * In production, this would be replaced with a real ProductRepository.
 */
final class ProductMockService implements ProductMockServiceInterface
{
    private array $products = [];

    public function __construct(
        private readonly UserRepository $userRepository
    ) {
        $this->initializeMockProducts();
    }

    public function findAll(): array
    {
        return $this->products;
    }

    public function findById(int $id): ?ProductV2
    {
        foreach ($this->products as $product) {
            if ($product->getId() === $id) {
                return $product;
            }
        }

        return null;
    }

    public function findByCategory(string $category): array
    {
        return array_filter(
            $this->products,
            fn (ProductV2 $product) => $product->getCategory() === $category
        );
    }

    public function findBySeller(int $sellerId): array
    {
        return array_filter(
            $this->products,
            fn (ProductV2 $product) => $product->getSeller()?->getId() === $sellerId
        );
    }

    private function initializeMockProducts(): void
    {
        // Fetch real users from database
        $user1 = $this->userRepository->findOneBy(['email' => 'chat.user1@test.com']);
        $user2 = $this->userRepository->findOneBy(['email' => 'chat.user2@test.com']);
        // Fallback to user1 if user3 doesn't exist
        $user3 = $user1;
        $admin = $user2;

        $this->products = [
            // Électronique
            new ProductV2(
                id: 1,
                title: 'iPhone 14 Pro 256GB',
                description: 'iPhone 14 Pro en excellent état, couleur Space Black. Vendu avec boîte d\'origine, chargeur et écouteurs. Aucune rayure, batterie à 95%.',
                price: 899.00,
                category: 'Électronique',
                location: 'Paris, 75001',
                images: [
                    'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=800',
                    'https://images.unsplash.com/photo-1678685888221-c57c3c5d7e76?w=800',
                ],
                condition: 'Comme neuf',
                createdAt: new DateTimeImmutable('-3 days'),
                seller: $user1
            ),

            new ProductV2(
                id: 2,
                title: 'MacBook Air M2 2023',
                description: 'MacBook Air M2, 8GB RAM, 256GB SSD. Acheté il y a 6 mois, sous garantie Apple jusqu\'en 2025. Parfait état, très peu utilisé.',
                price: 1099.00,
                category: 'Électronique',
                location: 'Lyon, 69002',
                images: [
                    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
                ],
                condition: 'Comme neuf',
                createdAt: new DateTimeImmutable('-1 week'),
                seller: $user2
            ),

            new ProductV2(
                id: 3,
                title: 'PlayStation 5 + 2 manettes',
                description: 'PS5 édition standard avec lecteur Blu-ray. Vendue avec 2 manettes DualSense, tous les câbles et 3 jeux (FIFA 24, Spider-Man 2, God of War Ragnarök).',
                price: 499.00,
                category: 'Électronique',
                location: 'Marseille, 13001',
                images: [
                    'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=800',
                    'https://images.unsplash.com/photo-1622297845775-5ff3fef71d13?w=800',
                ],
                condition: 'Très bon état',
                createdAt: new DateTimeImmutable('-5 days'),
                seller: $user3
            ),

            // Mobilier & Décoration
            new ProductV2(
                id: 4,
                title: 'Canapé 3 places en cuir véritable',
                description: 'Magnifique canapé en cuir pleine fleur couleur cognac. Très confortable, structure en bois massif. Dimensions: L220 x P95 x H85 cm. Cause déménagement.',
                price: 750.00,
                category: 'Mobilier',
                location: 'Bordeaux, 33000',
                images: [
                    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800',
                ],
                condition: 'Bon état',
                createdAt: new DateTimeImmutable('-2 days'),
                seller: $admin
            ),

            new ProductV2(
                id: 5,
                title: 'Bureau en bois massif style scandinave',
                description: 'Bureau design scandinave en chêne massif. 140x70 cm, 3 tiroirs. Parfait pour télétravail. Assemblage facile, notice fournie.',
                price: 280.00,
                category: 'Mobilier',
                location: 'Toulouse, 31000',
                images: [
                    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=800',
                    'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800',
                ],
                condition: 'Neuf',
                createdAt: new DateTimeImmutable('-4 hours'),
                seller: $user1
            ),

            // Vêtements & Mode
            new ProductV2(
                id: 6,
                title: 'Veste en cuir homme Schott NYC',
                description: 'Veste en cuir véritable de la marque américaine Schott. Taille M (correspond à L français). Portée 3 fois seulement. Modèle intemporel.',
                price: 350.00,
                category: 'Mode',
                location: 'Nice, 06000',
                images: [
                    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
                ],
                condition: 'Comme neuf',
                createdAt: new DateTimeImmutable('-6 days'),
                seller: $user2
            ),

            new ProductV2(
                id: 7,
                title: 'Sac à main Louis Vuitton Neverfull MM',
                description: 'Sac Louis Vuitton authentique avec certificat d\'authenticité. Modèle Neverfull MM en toile monogram. Acheté en boutique en 2022.',
                price: 1200.00,
                category: 'Mode',
                location: 'Paris, 75008',
                images: [
                    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800',
                ],
                condition: 'Très bon état',
                createdAt: new DateTimeImmutable('-1 day'),
                seller: $user3
            ),

            // Sport & Loisirs
            new ProductV2(
                id: 8,
                title: 'Vélo de route Specialized Tarmac',
                description: 'Vélo de route carbone Specialized Tarmac SL6. Groupe Shimano 105, roues DT Swiss. Entretien régulier, excellent état. Taille 56.',
                price: 1800.00,
                category: 'Sport',
                location: 'Nantes, 44000',
                images: [
                    'https://images.unsplash.com/photo-1576435728678-68d0fbf94e91?w=800',
                    'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=800',
                ],
                condition: 'Très bon état',
                createdAt: new DateTimeImmutable('-8 days'),
                seller: $admin
            ),

            new ProductV2(
                id: 9,
                title: 'Tapis de yoga Lululemon + accessoires',
                description: 'Tapis de yoga professionnel Lululemon 5mm d\'épaisseur. Vendu avec sangle de transport, 2 briques en liège et sangle d\'étirement.',
                price: 85.00,
                category: 'Sport',
                location: 'Montpellier, 34000',
                images: [
                    'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800',
                ],
                condition: 'Bon état',
                createdAt: new DateTimeImmutable('-12 hours'),
                seller: $user1
            ),

            // Auto & Moto
            new ProductV2(
                id: 10,
                title: 'Peugeot 208 GT Line 2021',
                description: 'Peugeot 208 GT Line essence 1.2 PureTech 130ch. 25 000 km, première main. Garantie constructeur jusqu\'en 2026. Révision à jour.',
                price: 17500.00,
                category: 'Automobile',
                location: 'Strasbourg, 67000',
                images: [
                    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800',
                ],
                condition: 'Très bon état',
                createdAt: new DateTimeImmutable('-2 weeks'),
                seller: $user2
            ),

            // Maison & Jardin
            new ProductV2(
                id: 11,
                title: 'Tondeuse robot Husqvarna Automower',
                description: 'Tondeuse robot Husqvarna Automower 315X. Convient pour jardins jusqu\'à 1500m². Station de charge, câble périphérique et piquets inclus.',
                price: 1400.00,
                category: 'Jardin',
                location: 'Rennes, 35000',
                images: [
                    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
                ],
                condition: 'Bon état',
                createdAt: new DateTimeImmutable('-10 days'),
                seller: $user3
            ),

            // Électroménager
            new ProductV2(
                id: 12,
                title: 'Machine à café Delonghi Magnifica S',
                description: 'Machine à café automatique avec broyeur intégré. Prépare espresso, cappuccino, latte. Nettoyage automatique. Peu utilisée, garantie valable.',
                price: 380.00,
                category: 'Électroménager',
                location: 'Lille, 59000',
                images: [
                    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
                ],
                condition: 'Comme neuf',
                createdAt: new DateTimeImmutable('-3 days'),
                seller: $admin
            ),

            // Instruments de musique
            new ProductV2(
                id: 13,
                title: 'Guitare électrique Fender Stratocaster',
                description: 'Fender Stratocaster américaine. Sunburst 3 tons, micros single coil d\'origine. Avec étui rigide Fender. Son exceptionnel.',
                price: 1650.00,
                category: 'Musique',
                location: 'Lyon, 69003',
                images: [
                    'https://images.unsplash.com/photo-1564186763535-ebb21ef5277f?w=800',
                ],
                condition: 'Très bon état',
                createdAt: new DateTimeImmutable('-1 week'),
                seller: $user1
            ),

            // Livres & Collections
            new ProductV2(
                id: 14,
                title: 'Collection Harry Potter édition collector',
                description: 'Intégrale Harry Potter en édition collector illustrée. 7 tomes sous coffret. Couverture rigide, illustrations de Jim Kay. État parfait.',
                price: 220.00,
                category: 'Livres',
                location: 'Paris, 75015',
                images: [
                    'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=800',
                ],
                condition: 'Neuf',
                createdAt: new DateTimeImmutable('-5 hours'),
                seller: $user2
            ),

            // Jeux & Jouets
            new ProductV2(
                id: 15,
                title: 'LEGO Millennium Falcon UCS 75192',
                description: 'LEGO Star Wars Millennium Falcon Ultimate Collector Series. Neuf scellé, jamais ouvert. 7541 pièces. Pièce de collection rare.',
                price: 899.00,
                category: 'Jeux & Jouets',
                location: 'Marseille, 13008',
                images: [
                    'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=800',
                ],
                condition: 'Neuf',
                createdAt: new DateTimeImmutable('-2 days'),
                seller: $user3
            ),
        ];
    }
}
