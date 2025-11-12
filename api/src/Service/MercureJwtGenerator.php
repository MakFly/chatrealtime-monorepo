<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\ChatRoomRepository;
use App\Repository\ChatRoomV2Repository;
use Lcobucci\JWT\Configuration;
use Lcobucci\JWT\Signer\Hmac\Sha256;
use Lcobucci\JWT\Signer\Key\InMemory;

/**
 * Service to generate Mercure JWT tokens with authorized topics.
 *
 * ✅ UNIFIED TOKEN: Includes both V1 and V2 topics in a single JWT
 * This allows seamless migration and compatibility between chat versions.
 */
final class MercureJwtGenerator
{
    private Configuration $jwtConfig;

    public function __construct(
        private readonly ChatRoomRepository $chatRoomRepository,
        private readonly ChatRoomV2Repository $chatRoomV2Repository,
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
     * ✅ UNIFIED TOKEN: Includes both V1 and V2 topics
     *
     * The JWT will include subscribe claims for all accessible chat rooms:
     * - V1: Rooms where user is an explicit participant (private/group)
     * - V1: All public rooms (auto-join for authenticated users)
     * - V2: Marketplace product chat rooms (accessible by buyer/seller)
     * - V2: User-specific topic for new room notifications
     */
    public function generateToken(User $user): string
    {
        $now = new \DateTimeImmutable();

        // ✅ V1: Get all accessible chat rooms (includes public rooms + participant rooms)
        $chatRoomsV1 = $this->chatRoomRepository->findAccessibleByUser($user);

        // ✅ V2: Get all accessible marketplace chat rooms
        $chatRoomsV2 = $this->chatRoomV2Repository->findAccessibleByUser($user);

        // Build topics: /chat/room/{id} (V1) + /chat-v2/room/{id} (V2)
        $topics = [];

        // Add V1 topics
        foreach ($chatRoomsV1 as $chatRoom) {
            $topics[] = sprintf('/chat/room/%d', $chatRoom->getId());
        }

        // Add V2 topics
        foreach ($chatRoomsV2 as $chatRoom) {
            $topics[] = sprintf('/chat-v2/room/%d', $chatRoom->getId());
        }

        // Add V2 user-specific topic for new room notifications
        $topics[] = sprintf('/chat-v2/rooms/user/%d', $user->getId());

        // Debug log
        error_log(sprintf('[MercureJwtGenerator] 🔑 Generating token for user #%d (%s)', $user->getId(), $user->getEmail()));
        error_log(sprintf('[MercureJwtGenerator] 📡 Found %d accessible chat rooms (V1: %d, V2: %d)', count($chatRoomsV1) + count($chatRoomsV2), count($chatRoomsV1), count($chatRoomsV2)));
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
