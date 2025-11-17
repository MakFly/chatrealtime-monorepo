<?php

declare(strict_types=1);

namespace App\Service\V2;

use App\Entity\User;
use App\Repository\ChatRoomV2Repository;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;

/**
 * Service to generate Mercure JWT tokens for chat v2 with authorized topics.
 *
 * V2 uses /chat-v2 prefixed topics for marketplace product chats.
 */
final class MercureJwtGeneratorV2
{
    private Configuration $jwtConfig;

    public function __construct(
        private readonly ChatRoomV2Repository $chatRoomV2Repository,
        string $mercureJwtSecret,
    ) {
        $this->jwtConfig = Configuration::forSymmetricSigner(
            new Sha256(),
            InMemory::plainText($mercureJwtSecret)
        );
    }

    /**
     * Generate a Mercure JWT for the given user (v2 topics).
     *
     * The JWT will include subscribe claims for all accessible chat rooms:
     * - Rooms where user is an explicit participant (private/group)
     * - All public rooms (auto-join for authenticated users)
     */
    public function generateToken(User $user): string
    {
        $now = new \DateTimeImmutable();

        // Get all accessible chat rooms (includes public rooms + participant rooms)
        $chatRooms = $this->chatRoomV2Repository->findAccessibleByUser($user);

        // Build topics: /chat-v2/room/{id}
        $topics = [];
        foreach ($chatRooms as $chatRoom) {
            $topics[] = sprintf('/chat-v2/room/%d', $chatRoom->getId());
        }

        // Also add user-specific topic for new room notifications
        $topics[] = sprintf('/chat-v2/rooms/user/%d', $user->getId());

        // Debug log
        error_log(sprintf('[MercureJwtGeneratorV2] 🔑 Generating token for user #%d (%s)', $user->getId(), $user->getEmail()));
        error_log(sprintf('[MercureJwtGeneratorV2] 📡 Found %d accessible chat rooms', count($chatRooms)));
        error_log(sprintf('[MercureJwtGeneratorV2] 📋 Topics: %s', json_encode($topics)));

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
     * Generate a JWT for a specific chat room (v2).
     *
     * This is useful when a user just joined a room and needs immediate access.
     */
    public function generateTokenForRoom(int $roomId): string
    {
        $now = new \DateTimeImmutable();

        $topic = sprintf('/chat-v2/room/%d', $roomId);

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
