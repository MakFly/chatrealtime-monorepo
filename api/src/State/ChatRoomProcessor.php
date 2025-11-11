<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\User;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * ChatRoom State Processor.
 *
 * Automatically adds the creator as a participant with 'admin' role when creating a chat room.
 * Publishes room creation to Mercure for real-time synchronization across clients.
 */
final class ChatRoomProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
        private readonly HubInterface $mercureHub,
        private readonly SerializerInterface $serializer,
    ) {
    }

    /**
     * @param ChatRoom $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // Only process on POST (create) - check if it's a Post operation
        if ($operation instanceof \ApiPlatform\Metadata\Post) {
            $this->addCreatorAsParticipant($data);
        }

        // Delegate to default persist processor
        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // ✅ Publish to Mercure after persistence (only on POST/create)
        if ($operation instanceof \ApiPlatform\Metadata\Post && $data instanceof ChatRoom) {
            $this->publishToMercure($data);
        }

        return $result;
    }

    private function addCreatorAsParticipant(ChatRoom $chatRoom): void
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            return; // Skip if user is not authenticated (should not happen due to security)
        }

        // Check if user is already a participant
        foreach ($chatRoom->getParticipants() as $participant) {
            if ($participant->getUser() === $user) {
                return; // Already a participant
            }
        }

        // Create and add participant
        $participant = new ChatParticipant();
        $participant->setUser($user);
        $participant->setChatRoom($chatRoom);
        $participant->setRole('admin'); // Creator is always admin

        $chatRoom->addParticipant($participant);
    }

    /**
     * ✅ Publish room creation to Mercure for real-time updates
     *
     * Strategy:
     * - User-specific topics: /chat/rooms/user/{userId} for each participant (private/group rooms)
     * - Global topic: /chat/rooms for public rooms (visible to all authenticated users)
     */
    private function publishToMercure(ChatRoom $chatRoom): void
    {
        // Serialize room with same groups as API response
        $data = $this->serializer->serialize($chatRoom, 'json', [
            'groups' => ['chatRoom:read'],
            'enable_max_depth' => true,
        ]);

        $topics = [];

        // For all room types: publish to each participant's personal topic
        foreach ($chatRoom->getParticipants() as $participant) {
            $userId = $participant->getUser()->getId();
            $topics[] = sprintf('/chat/rooms/user/%d', $userId);
        }

        // For PUBLIC rooms: also publish to global topic
        if ($chatRoom->getType() === 'public') {
            $topics[] = '/chat/rooms';
            error_log(sprintf('[ChatRoomProcessor] 📢 Public room "%s" - broadcasting to global topic', $chatRoom->getName()));
        }

        // Debug log
        error_log(sprintf('[ChatRoomProcessor] 📤 Publishing room #%d "%s" (type: %s) to %d topics',
            $chatRoom->getId(),
            $chatRoom->getName(),
            $chatRoom->getType(),
            count($topics)
        ));

        // Publish to Mercure
        $update = new Update(
            topics: $topics,
            data: $data,
            private: true, // ✅ Only subscribers with valid JWT can receive
        );

        $this->mercureHub->publish($update);

        error_log(sprintf('[ChatRoomProcessor] ✅ Mercure publish completed for room #%d', $chatRoom->getId()));
    }
}

