<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Repository\ChatRoomRepository;
use App\State\ChatRoomCollectionProvider;
use App\State\ChatRoomProcessor;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ChatRoomRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ApiResource(
    mercure: true,
    normalizationContext: ['groups' => ['chatRoom:read']],
    denormalizationContext: ['groups' => ['chatRoom:write']],
    operations: [
        new GetCollection(
            security: "is_granted('ROLE_USER')",
            provider: ChatRoomCollectionProvider::class
        ),
        new Get(security: "is_granted('VIEW', object)"),
        new Post(
            security: "is_granted('ROLE_USER')",
            processor: ChatRoomProcessor::class
        ),
        new Patch(security: "is_granted('EDIT', object)"),
        new Delete(security: "is_granted('DELETE', object)"),
    ]
)]
class ChatRoom
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['chatRoom:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank]
    #[Assert\Length(min: 1, max: 255)]
    #[Groups(['chatRoom:read', 'chatRoom:write', 'message:read'])]
    private string $name;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['direct', 'group', 'public'])]
    #[Groups(['chatRoom:read', 'chatRoom:write'])]
    private string $type;

    #[ORM\OneToMany(mappedBy: 'chatRoom', targetEntity: Message::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['chatRoom:read'])]
    private Collection $messages;

    #[ORM\OneToMany(mappedBy: 'chatRoom', targetEntity: ChatParticipant::class, cascade: ['persist', 'remove'], orphanRemoval: true)]
    #[Groups(['chatRoom:read'])]
    private Collection $participants;

    #[ORM\Column]
    #[Groups(['chatRoom:read'])]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column]
    #[Groups(['chatRoom:read'])]
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

    /**
     * @return Collection<int, Message>
     */
    public function getMessages(): Collection
    {
        return $this->messages;
    }

    public function addMessage(Message $message): static
    {
        if (!$this->messages->contains($message)) {
            $this->messages->add($message);
            $message->setChatRoom($this);
        }

        return $this;
    }

    public function removeMessage(Message $message): static
    {
        if ($this->messages->removeElement($message)) {
            if ($message->getChatRoom() === $this) {
                $message->setChatRoom(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, ChatParticipant>
     */
    public function getParticipants(): Collection
    {
        return $this->participants;
    }

    public function addParticipant(ChatParticipant $participant): static
    {
        if (!$this->participants->contains($participant)) {
            $this->participants->add($participant);
            $participant->setChatRoom($this);
        }

        return $this;
    }

    public function removeParticipant(ChatParticipant $participant): static
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
}
