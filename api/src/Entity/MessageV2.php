<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiFilter;
use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Doctrine\Orm\Filter\SearchFilter;
use App\Repository\MessageV2Repository;
use App\State\MessageV2Processor;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Serializer\Annotation\MaxDepth;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: MessageV2Repository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(columns: ['chat_room_v2_id'], name: 'idx_message_v2_chat_room')]
#[ORM\Index(columns: ['created_at'], name: 'idx_message_v2_created_at')]
#[ApiResource(
    uriTemplate: '/v2/messages/{id}',
    shortName: 'MessageV2',
    mercure: true,
    normalizationContext: ['groups' => ['messageV2:read']],
    denormalizationContext: ['groups' => ['messageV2:write']],
    operations: [
        new GetCollection(
            uriTemplate: '/v2/messages'
        ),
        new Get(),
        new Post(
            uriTemplate: '/v2/messages',
            security: "is_granted('ROLE_USER')",
            processor: MessageV2Processor::class
        ),
        new Delete(security: "is_granted('DELETE', object)"),
    ]
)]
#[ApiFilter(SearchFilter::class, properties: ['chatRoom' => 'exact'])]
class MessageV2
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['messageV2:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Groups(['messageV2:read', 'messageV2:write'])]
    #[MaxDepth(1)]
    private ?User $author = null;

    #[ORM\ManyToOne(targetEntity: ChatRoomV2::class, inversedBy: 'messages')]
    #[ORM\JoinColumn(nullable: false, name: 'chat_room_v2_id')]
    #[Groups(['messageV2:read', 'messageV2:write'])]
    private ?ChatRoomV2 $chatRoom = null;

    #[ORM\Column(type: Types::TEXT)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 5000)]
    #[Groups(['messageV2:read', 'messageV2:write'])]
    private string $content;

    #[ORM\Column]
    #[Groups(['messageV2:read'])]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getAuthor(): ?User
    {
        return $this->author;
    }

    public function setAuthor(?User $author): static
    {
        $this->author = $author;

        return $this;
    }

    public function getChatRoom(): ?ChatRoomV2
    {
        return $this->chatRoom;
    }

    public function setChatRoom(?ChatRoomV2 $chatRoom): static
    {
        $this->chatRoom = $chatRoom;

        return $this;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function setContent(string $content): static
    {
        $this->content = $content;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    /**
     * Get Mercure topic for this message (v2 uses /chat-v2 prefix).
     */
    public function getMercureTopic(): string
    {
        return sprintf('/chat-v2/room/%d', $this->chatRoom?->getId() ?? 0);
    }
}
