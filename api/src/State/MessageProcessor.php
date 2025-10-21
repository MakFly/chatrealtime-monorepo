<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Message;
use App\Entity\User;
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
    ) {
    }

    /**
     * @param Message $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // Only process on POST (create)
        if ($operation->getName() === '_api_/messages{._format}_post') {
            $this->validateAndSetAuthor($data);
        }

        // Delegate to default persist processor
        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // ✅ Publish to Mercure after persistence (only on POST/create)
        if ($operation->getName() === '_api_/messages{._format}_post' && $data instanceof Message) {
            $this->publishToMercure($data);
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

        // Validate that user is a participant of the chat room
        $chatRoom = $message->getChatRoom();

        if ($chatRoom === null) {
            throw new AccessDeniedHttpException('Chat room is required.');
        }

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
}
