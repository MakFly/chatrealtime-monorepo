<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\Message;
use App\Entity\User;
use App\Service\V1\ChatUnreadV1Service;
use App\Service\V1\ChatUnreadMercurePublisher;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * Message State Processor.
 *
 * Validates that the user is a participant of the chat room before creating a message.
 * Sets the author to the current user.
 */
final class MessageProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
        private readonly HubInterface $mercureHub,
        private readonly SerializerInterface $serializer,
        private readonly ChatUnreadV1Service $unreadService,
        private readonly ChatUnreadMercurePublisher $unreadPublisher,
        private readonly EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * @param Message $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // Only process on POST (create) - check if it's a Post operation
        if ($operation instanceof \ApiPlatform\Metadata\Post) {
            $this->validateAndSetAuthor($data);
        }

        // Delegate to default persist processor
        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // ✅ Publish to Mercure after persistence (only on POST/create)
        if ($operation instanceof \ApiPlatform\Metadata\Post && $data instanceof Message) {
            $this->publishToMercure($data);
            $this->handleUnreadCounts($data);
        }

        return $result;
    }

    private function validateAndSetAuthor(Message $message): void
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
            // ✅ Auto-create participant for public rooms to enable unread tracking
            $this->ensurePublicRoomParticipant($user, $chatRoom);
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
     * ✅ Publish message to Mercure for real-time updates
     */
    private function publishToMercure(Message $message): void
    {
        $chatRoomId = $message->getChatRoom()->getId();
        $topic = sprintf('/chat/room/%d', $chatRoomId);
        
        // Serialize message with same groups as API response
        $data = $this->serializer->serialize($message, 'json', [
            'groups' => ['message:read'],
            'enable_max_depth' => true,
        ]);

        // Debug log
        error_log(sprintf('[MessageProcessor] 📤 Publishing to Mercure topic: %s', $topic));
        error_log(sprintf('[MessageProcessor] 📦 Data: %s', substr($data, 0, 200)));

        // Publish to Mercure topic: /chat/room/{id}
        $update = new Update(
            topics: [$topic],
            data: $data,
            private: true, // ✅ Only subscribers with valid JWT can receive
        );

        $this->mercureHub->publish($update);

        error_log('[MessageProcessor] ✅ Mercure publish completed');
    }

    /**
     * ✅ Handle unread counts for participants
     */
    private function handleUnreadCounts(Message $message): void
    {
        $author = $message->getAuthor();
        $room = $message->getChatRoom();

        error_log('[MessageProcessor] 📨 Handling unread counts...');
        error_log(sprintf('[MessageProcessor] Room ID: %d, Participants: %d, Author ID: %d',
            $room->getId(), count($room->getParticipants()), $author->getId()));

        // Increment unread count for all participants except the author
        $incrementedCount = 0;
        foreach ($room->getParticipants() as $participant) {
            if ($participant->getUser() !== $author) {
                error_log(sprintf('[MessageProcessor] Incrementing unread for user ID: %d',
                    $participant->getUser()->getId()));
                $this->unreadService->incrementUnread($participant);
                $incrementedCount++;
            }
        }

        error_log(sprintf('[MessageProcessor] Incremented unread count for %d participants', $incrementedCount));

        // Publish unread counts via Mercure (excluding the author)
        error_log('[MessageProcessor] Publishing unread counts to Mercure...');
        $this->unreadPublisher->publishUnreadCountsForRoom($room, $author);
        error_log('[MessageProcessor] ✅ Unread processing complete');
    }

    /**
     * ✅ Auto-create participant for public rooms to enable unread tracking and Mercure notifications
     */
    private function ensurePublicRoomParticipant(User $user, ChatRoom $room): void
    {
        if ($room->getType() !== 'public') {
            return;
        }

        // Check if participant already exists
        foreach ($room->getParticipants() as $participant) {
            if ($participant->getUser() === $user) {
                return; // Already a participant
            }
        }

        // Create new participant
        $participant = new ChatParticipant();
        $participant->setUser($user);
        $participant->setChatRoom($room);
        $participant->setRole('member');

        $this->entityManager->persist($participant);
        $this->entityManager->flush();

        error_log(sprintf('[MessageProcessor] ✅ Auto-created participant for user %d in public room %d',
            $user->getId(), $room->getId()));
    }
}
