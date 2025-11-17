<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\ChatParticipantV2;
use App\Entity\ChatRoomV2;
use App\Entity\User;
use App\Service\V2\ProductMockServiceInterface;
use Symfony\Bundle\SecurityBundle\Security;
use Symfony\Component\DependencyInjection\Attribute\Autowire;
use Symfony\Component\HttpKernel\Exception\BadRequestException;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;
use Symfony\Component\Serializer\SerializerInterface;

/**
 * ChatRoomV2 State Processor.
 *
 * - Validates that the product exists before creating room
 * - Automatically adds the creator as a participant with 'admin' role
 * - Publishes room creation to Mercure for real-time synchronization
 */
final class ChatRoomV2Processor implements ProcessorInterface
{
    public function __construct(
        #[Autowire(service: 'api_platform.doctrine.orm.state.persist_processor')]
        private readonly ProcessorInterface $persistProcessor,
        private readonly Security $security,
        private readonly HubInterface $mercureHub,
        private readonly SerializerInterface $serializer,
        private readonly ProductMockServiceInterface $productMockService,
    ) {
    }

    /**
     * @param ChatRoomV2 $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): mixed
    {
        // Only process on POST (create) - check if it's a Post operation
        if ($operation instanceof \ApiPlatform\Metadata\Post) {
            $this->validateProduct($data);
            $this->addCreatorAsParticipant($data);
        }

        // Delegate to default persist processor
        $result = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // Publish to Mercure after persistence (only on POST/create)
        if ($operation instanceof \ApiPlatform\Metadata\Post && $data instanceof ChatRoomV2) {
            $this->publishToMercure($data);
        }

        return $result;
    }

    /**
     * Validate that the product exists in the mock service.
     * Throws BadRequestException if product not found.
     */
    private function validateProduct(ChatRoomV2 $chatRoom): void
    {
        $product = $this->productMockService->findById($chatRoom->getProductId());

        if ($product === null) {
            throw new BadRequestException(sprintf(
                'Product with ID %d does not exist',
                $chatRoom->getProductId()
            ));
        }

        // Cache product title in room for easier access
        if (empty($chatRoom->getProductTitle())) {
            $chatRoom->setProductTitle($product->getTitle());
        }
    }

    private function addCreatorAsParticipant(ChatRoomV2 $chatRoom): void
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
        $participant = new ChatParticipantV2();
        $participant->setUser($user);
        $participant->setChatRoom($chatRoom);
        $participant->setRole('admin'); // Creator is always admin

        $chatRoom->addParticipant($participant);
    }

    /**
     * Publish room creation to Mercure for real-time updates.
     *
     * Strategy:
     * - User-specific topics: /chat-v2/rooms/user/{userId} for each participant
     * - Global topic: /chat-v2/rooms for public rooms
     */
    private function publishToMercure(ChatRoomV2 $chatRoom): void
    {
        // Serialize room with same groups as API response
        $data = $this->serializer->serialize($chatRoom, 'json', [
            'groups' => ['chatRoomV2:read'],
            'enable_max_depth' => true,
        ]);

        $topics = [];

        // For all room types: publish to each participant's personal topic
        foreach ($chatRoom->getParticipants() as $participant) {
            $userId = $participant->getUser()->getId();
            $topics[] = sprintf('/chat-v2/rooms/user/%d', $userId);
        }

        // For PUBLIC rooms: also publish to global topic
        if ($chatRoom->getType() === 'public') {
            $topics[] = '/chat-v2/rooms';
            error_log(sprintf('[ChatRoomV2Processor] 📢 Public room "%s" (product #%d) - broadcasting to global topic',
                $chatRoom->getName(),
                $chatRoom->getProductId()
            ));
        }

        // Debug log
        error_log(sprintf('[ChatRoomV2Processor] 📤 Publishing room #%d "%s" (type: %s, product: #%d) to %d topics',
            $chatRoom->getId(),
            $chatRoom->getName(),
            $chatRoom->getType(),
            $chatRoom->getProductId(),
            count($topics)
        ));

        // Publish to Mercure
        $update = new Update(
            topics: $topics,
            data: $data,
            private: true, // Only subscribers with valid JWT can receive
        );

        $this->mercureHub->publish($update);

        error_log(sprintf('[ChatRoomV2Processor] ✅ Mercure publish completed for room #%d', $chatRoom->getId()));
    }
}
