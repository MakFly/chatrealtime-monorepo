<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use App\Repository\ChatRoomV2Repository;
use App\State\ChatRoomV2CollectionProvider;
use App\State\ChatRoomV2Processor;
use App\State\LeaveRoomProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ChatRoomV2Repository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    uriTemplate: '/v2/chat_rooms/{id}',
    shortName: 'ChatRoomV2',
    mercure: true,
    normalizationContext: ['groups' => ['chatRoomV2:read']],
    denormalizationContext: ['groups' => ['chatRoomV2:write']],
    operations: [
        new GetCollection(
            uriTemplate: '/v2/chat_rooms',
            security: "is_granted('ROLE_USER')",
            provider: ChatRoomV2CollectionProvider::class
        ),
        new Get(security: "is_granted('VIEW', object)"),
        new Post(
            uriTemplate: '/v2/chat_rooms',
            security: "is_granted('ROLE_USER')",
            processor: ChatRoomV2Processor::class
        ),
        new Patch(security: "is_granted('EDIT', object)"),
        new Delete(security: "is_granted('DELETE', object)"),
        new Post(
            uriTemplate: '/v2/chat_rooms/{id}/leave',
            security: "is_granted('VIEW', object)",
            processor: LeaveRoomProcessor::class,
            name: 'leave_room'
        ),
    ]
)]
class ChatRoomV2
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['chatRoomV2:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 255)]
    #[Groups(['chatRoomV2:read', 'chatRoomV2:write', 'messageV2:read'])]
    private string $name;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['direct', 'group', 'public'])]
    #[Groups(['chatRoomV2:read', 'chatRoomV2:write'])]
    private string $type;

    // ** NEW FIELDS FOR V2 **
    #[ORM\Column]
    #[Assert\NotBlank]
    #[Assert\Positive]
    #[Groups(['chatRoomV2:read', 'chatRoomV2:write'])]
    private int $productId;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 255)]
    #[Groups(['chatRoomV2:read', 'chatRoomV2:write'])]
    private string $productTitle;

    #[ORM\OneToMany(mappedBy: 'chatRoom', targetEntity: MessageV2::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['chatRoomV2:read'])]
    private Collection $messages;

    #[ORM\OneToMany(mappedBy: 'chatRoom', targetEntity: ChatParticipantV2::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['chatRoomV2:read'])]
    private Collection $participants;

    #[ORM\Column]
    #[Groups(['chatRoomV2:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    #[Groups(['chatRoomV2:read'])]
    private \DateTimeImmutable $updatedAt;

    public function __construct()
    {
        $this->messages = new ArrayCollection();
        $this->participants = new ArrayCollection();
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getType(): string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getProductId(): int
    {
        return $this->productId;
    }

    public function setProductId(int $productId): static
    {
        $this->productId = $productId;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    public function getProductTitle(): string
    {
        return $this->productTitle;
    }

    public function setProductTitle(string $productTitle): static
    {
        $this->productTitle = $productTitle;
        $this->updatedAt = new \DateTimeImmutable();

        return $this;
    }

    /**
     * @return Collection<int, MessageV2>
     */
    public function getMessages(): Collection
    {
        return $this->messages;
    }

    public function addMessage(MessageV2 $message): static
    {
        if (!$this->messages->contains($message)) {
            $this->messages->add($message);
            $message->setChatRoom($this);
        }

        return $this;
    }

    public function removeMessage(MessageV2 $message): static
    {
        if ($this->messages->removeElement($message)) {
            if ($message->getChatRoom() === $this) {
                $message->setChatRoom(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ChatParticipantV2>
     */
    public function getParticipants(): Collection
    {
        return $this->participants;
    }

    public function addParticipant(ChatParticipantV2 $participant): static
    {
        if (!$this->participants->contains($participant)) {
            $this->participants->add($participant);
            $participant->setChatRoom($this);
        }

        return $this;
    }

    public function removeParticipant(ChatParticipantV2 $participant): static
    {
        if ($this->participants->removeElement($participant)) {
            if ($participant->getChatRoom() === $this) {
                $participant->setChatRoom(null);
            }
        }

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): \DateTimeImmutable
    {
        return $this->updatedAt;
    }

    #[ORM\PrePersist]
    public function setCreatedAtValue(): void
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->updatedAt = new \DateTimeImmutable();
    }

    #[ORM\PreUpdate]
    public function setUpdatedAtValue(): void
    {
        $this->updatedAt = new \DateTimeImmutable();
    }

    /**
     * Get Mercure topic for room updates
     */
    public function getMercureTopic(): string
    {
        return sprintf('/chat-v2/room/%d', $this->id ?? 0);
    }
}
