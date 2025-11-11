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

/**
 * ChatRoom State Processor.
 *
 * Automatically adds the creator as a participant with 'admin' role when creating a chat room.
 */
final class ChatRoomProcessor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
    ) {
    }

    /**
     * @param ChatRoom $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // Only process on POST (create)
        if ($operation->getName() === '_api_/chat_rooms{._format}_post') {
            $this->addCreatorAsParticipant($data);
        }

        // Delegate to default persist processor
        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
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
}

