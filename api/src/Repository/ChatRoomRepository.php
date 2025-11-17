<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\User;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChatRoom>
 */
class ChatRoomRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChatRoom::class);
    }

    /**
     * Find all chat rooms where the user is a participant.
     *
     * @return ChatRoom[]
     */
    public function findByParticipant(User $user): array
    {
        return $this->createQueryBuilder('cr')
            ->innerJoin('cr.participants', 'p')
            ->where('p.user = :user')
            ->setParameter('user', $user)
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all public chat rooms.
     *
     * @return ChatRoom[]
     */
    public function findPublicRooms(): array
    {
        return $this->createQueryBuilder('cr')
            ->where('cr.type = :type')
            ->setParameter('type', 'public')
            ->orderBy('cr.updatedAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Find all chat rooms accessible by a user.
     * Includes:
     * - Rooms where user is a participant (private/group)
     * - All public rooms (auto-joined for all authenticated users)
     *
     * IMPORTANT: This method automatically creates ChatParticipant records
     * for public rooms where the user is not yet a participant.
     * This ensures notifications work correctly for public channels.
     *
     * @return ChatRoom[]
     */
    public function findAccessibleByUser(User $user): array
    {
        error_log(sprintf('[ChatRoomRepository] 🔍 Finding accessible rooms for user ID: %d', $user->getId()));

        // Use two separate queries and merge results to avoid LEFT JOIN complexity
        $participantRooms = $this->createQueryBuilder('cr')
            ->innerJoin('cr.participants', 'p')
            ->where('p.user = :user')
            ->setParameter('user', $user)
            ->getQuery()
            ->getResult();

        error_log(sprintf('[ChatRoomRepository] Found %d rooms where user is participant', count($participantRooms)));

        $publicRooms = $this->createQueryBuilder('cr')
            ->where('cr.type = :publicType')
            ->setParameter('publicType', 'public')
            ->getQuery()
            ->getResult();

        error_log(sprintf('[ChatRoomRepository] Found %d public rooms', count($publicRooms)));

        // Auto-join: Create participant records for public rooms where user is not yet a participant
        $autoJoinCount = 0;
        $em = $this->getEntityManager();

        // Get IDs of rooms where user is already a participant
        $existingParticipantRoomIds = array_map(fn($room) => $room->getId(), $participantRooms);

        foreach ($publicRooms as $publicRoom) {
            // Check if user is already a participant of this public room
            if (!in_array($publicRoom->getId(), $existingParticipantRoomIds, true)) {
                error_log(sprintf('[ChatRoomRepository] 🔧 Auto-joining user %d to public room %d (%s)',
                    $user->getId(), $publicRoom->getId(), $publicRoom->getName()));

                // Create participant record
                $participant = new ChatParticipant();
                $participant->setUser($user);
                $participant->setChatRoom($publicRoom);
                $participant->setRole('member');
                // joinedAt is set automatically in ChatParticipant constructor

                $em->persist($participant);
                $autoJoinCount++;
            }
        }

        // Flush all participant creations in one batch for performance
        if ($autoJoinCount > 0) {
            $em->flush();
            error_log(sprintf('[ChatRoomRepository] ✅ Auto-joined user to %d public rooms', $autoJoinCount));
        } else {
            error_log('[ChatRoomRepository] ℹ️  No auto-join needed (user already participant of all public rooms)');
        }

        // Merge and deduplicate by ID
        $rooms = [];
        foreach ($participantRooms as $room) {
            $rooms[$room->getId()] = $room;
        }
        foreach ($publicRooms as $room) {
            $rooms[$room->getId()] = $room;
        }

        // Sort by updatedAt DESC
        usort($rooms, fn($a, $b) => $b->getUpdatedAt() <=> $a->getUpdatedAt());

        error_log(sprintf('[ChatRoomRepository] 📋 Returning %d total accessible rooms', count($rooms)));

        return array_values($rooms);
    }
}
