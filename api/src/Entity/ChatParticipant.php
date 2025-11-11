<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Post;
use App\Repository\ChatParticipantRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ChatParticipantRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(columns: ['user_id'], name: 'idx_chat_participant_user')]
#[ORM\Index(columns: ['chat_room_id'], name: 'idx_chat_participant_room')]
#[ORM\UniqueConstraint(name: 'idx_chat_participant_unique', columns: ['user_id', 'chat_room_id'])]
#[UniqueEntity(fields: ['user', 'chatRoom'], message: 'User is already a participant in this room')]
#[ApiResource(
    uriTemplate: '/v1/chat_participants/{id}',
    normalizationContext: ['groups' => ['chatParticipant:read']],
    denormalizationContext: ['groups' => ['chatParticipant:write']],
    operations: [
        new Post(
            uriTemplate: '/v1/chat_participants',
            security: "is_granted('ROLE_USER')"
        ),
        new Delete(security: "is_granted('DELETE', object)"),
    ]
)]
class ChatParticipant
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['chatParticipant:read', 'chatRoom:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    #[Groups(['chatParticipant:read', 'chatParticipant:write', 'chatRoom:read'])]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: ChatRoom::class, inversedBy: 'participants')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    #[Groups(['chatParticipant:read', 'chatParticipant:write'])]
    private ?ChatRoom $chatRoom = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['admin', 'member'])]
    #[Groups(['chatParticipant:read', 'chatParticipant:write', 'chatRoom:read'])]
    private string $role = 'member';

    #[ORM\Column]
    #[Groups(['chatParticipant:read', 'chatRoom:read'])]
    private \DateTimeImmutable $joinedAt;

    public function __construct()
    {
        $this->joinedAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;

        return $this;
    }

    public function getChatRoom(): ?ChatRoom
    {
        return $this->chatRoom;
    }

    public function setChatRoom(?ChatRoom $chatRoom): static
    {
        $this->chatRoom = $chatRoom;

        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function getJoinedAt(): \DateTimeImmutable
    {
        return $this->joinedAt;
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    #[ORM\PrePersist]
    public function setJoinedAtValue(): void
    {
        $this->joinedAt = new \DateTimeImmutable();
    }
}
