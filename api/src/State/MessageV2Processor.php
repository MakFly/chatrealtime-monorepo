<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\MessageV2;
use App\Entity\User;
use App\Service\ChatParticipantRestoreService;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * MessageV2 State Processor.
 *
 * Validates that the user is a participant of the chat room before creating a message.
 * Sets the author to the current user.
 * Publishes to Mercure with /chat-v2 topics.
 */
final class MessageV2Processor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
        private readonly HubInterface $mercureHub,
        private readonly SerializerInterface $serializer,
        private readonly ChatParticipantRestoreService $restoreService,
    ) {
    }

    /**
     * @param MessageV2 $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // Only process on POST (create) - check if it's a Post operation
        if ($operation instanceof \ApiPlatform\Metadata\Post) {
            $this->validateAndSetAuthor($data);

            // Restore any soft-deleted participants before creating the message
            // This ensures users who deleted the conversation will see new messages
            $chatRoom = $data->getChatRoom();
            if ($chatRoom !== null) {
                $restoredCount = $this->restoreService->restoreDeletedParticipants($chatRoom);
                if ($restoredCount > 0) {
                    error_log(sprintf('[MessageV2Processor] 🔄 Restored %d participant(s) in room #%d',
                        $restoredCount,
                        $chatRoom->getId()
                    ));
                }
            }
        }

        // Delegate to default persist processor
        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // Publish to Mercure after persistence (only on POST/create)
        if ($operation instanceof \ApiPlatform\Metadata\Post && $data instanceof MessageV2) {
            $this->publishToMercure($data);
        }

        return $result;
    }

    private function validateAndSetAuthor(MessageV2 $message): void
    {
        $user = $this->security->getUser();

        if (!$user instanceof User) {
            throw new AccessDeniedHttpException('User not authenticated.');
        }

        // Set the author
        $message->setAuthor($user);

        // Validate that user has access to the chat room
        $chatRoom = $message->getChatRoom();

        if ($chatRoom === null) {
            throw new AccessDeniedHttpException('Chat room is required.');
        }

        // For PUBLIC rooms: all authenticated users can send messages (auto-join)
        if ($chatRoom->getType() === 'public') {
            return; // Access granted
        }

        // For PRIVATE and GROUP rooms: user must be an explicit participant
        $isParticipant = false;
        foreach ($chatRoom->getParticipants() as $participant) {
            if ($participant->getUser() === $user) {
                $isParticipant = true;
                break;
            }
        }

        if (!$isParticipant) {
            throw new AccessDeniedHttpException('You are not a participant of this chat room.');
        }
    }

    /**
     * Publish message to Mercure for real-time updates (v2 uses /chat-v2 topics).
     */
    private function publishToMercure(MessageV2 $message): void
    {
        $chatRoomId = $message->getChatRoom()->getId();
        $topic = sprintf('/chat-v2/room/%d', $chatRoomId);

        // Serialize message with same groups as API response
        $data = $this->serializer->serialize($message, 'json', [
            'groups' => ['messageV2:read'],
            'enable_max_depth' => true,
        ]);

        // Debug log
        error_log(sprintf('[MessageV2Processor] 📤 Publishing to Mercure topic: %s', $topic));
        error_log(sprintf('[MessageV2Processor] 📦 Data: %s', substr($data, 0, 200)));

        // Publish to Mercure topic: /chat-v2/room/{id}
        $update = new Update(
            topics: [$topic],
            data: $data,
            private: true, // Only subscribers with valid JWT can receive
        );

        $this->mercureHub->publish($update);

        error_log('[MessageV2Processor] ✅ Mercure publish completed');
    }
}
