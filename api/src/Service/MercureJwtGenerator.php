<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\ChatRoomRepository;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;

/**
 * Service to generate Mercure JWT tokens with authorized topics.
 */
final class MercureJwtGenerator
{
    private Configuration $jwtConfig;

    public function __construct(
        private readonly ChatRoomRepository $chatRoomRepository,
        string $mercureJwtSecret,
    ) {
        $this->jwtConfig = Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::plainText($mercureJwtSecret)
        );
    }

    /**
     * Generate a Mercure JWT for the given user.
     *
     * The JWT will include subscribe claims for all accessible chat rooms:
     * - Rooms where user is an explicit participant (private/group)
     * - All public rooms (auto-join for authenticated users)
     */
    public function generateToken(User $user): string
    {
        $now = new \DateTimeImmutable();

        // ✅ Get all accessible chat rooms (includes public rooms + participant rooms)
        $chatRooms = $this->chatRoomRepository->findAccessibleByUser($user);

        // Build topics: /chat/room/{id}
        $topics = [];
        foreach ($chatRooms as $chatRoom) {
            $topics[] = sprintf('/chat/room/%d', $chatRoom->getId());
        }

        // Debug log
        error_log(sprintf('[MercureJwtGenerator] 🔑 Generating token for user #%d (%s)', $user->getId(), $user->getEmail()));
        error_log(sprintf('[MercureJwtGenerator] 📡 Found %d accessible chat rooms', count($chatRooms)));
        error_log(sprintf('[MercureJwtGenerator] 📋 Topics: %s', json_encode($topics)));

        // Create JWT token
        $token = $this->jwtConfig->builder()
            ->issuedAt($now)
            ->expiresAt($now->modify('+6 hours'))
            ->withClaim('mercure', [
                'subscribe' => $topics,
            ])
            ->getToken($this->jwtConfig->signer(), $this->jwtConfig->signingKey());

        return $token->toString();
    }

    /**
     * Generate a JWT for a specific chat room.
     *
     * This is useful when a user just joined a room and needs immediate access.
     */
    public function generateTokenForRoom(int $roomId): string
    {
        $now = new \DateTimeImmutable();

        $topic = sprintf('/chat/room/%d', $roomId);

        $token = $this->jwtConfig->builder()
            ->issuedAt($now)
            ->expiresAt($now->modify('+6 hours'))
            ->withClaim('mercure', [
                'subscribe' => [$topic],
            ])
            ->getToken($this->jwtConfig->signer(), $this->jwtConfig->signingKey());

        return $token->toString();
    }
}
