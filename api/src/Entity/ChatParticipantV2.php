<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Post;
use App\Repository\ChatParticipantV2Repository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Annotation\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: ChatParticipantV2Repository::class)]
#[ORM\HasLifecycleCallbacks]
#[ORM\Index(columns: ['user_id'], name: 'idx_chat_participant_v2_user')]
#[ORM\Index(columns: ['chat_room_v2_id'], name: 'idx_chat_participant_v2_room')]
#[ORM\UniqueConstraint(name: 'idx_chat_participant_v2_unique', columns: ['user_id', 'chat_room_v2_id'])]
#[UniqueEntity(fields: ['user', 'chatRoom'], message: 'User is already a participant in this room')]
#[ApiResource(
    uriTemplate: '/v2/chat_participants/{id}',
    shortName: 'ChatParticipantV2',
    normalizationContext: ['groups' => ['chatParticipantV2:read']],
    denormalizationContext: ['groups' => ['chatParticipantV2:write']],
    operations: [
        new Post(
            uriTemplate: '/v2/chat_participants',
            security: "is_granted('ROLE_USER')"
        ),
        new Delete(security: "is_granted('DELETE', object)"),
    ]
)]
class ChatParticipantV2
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['chatParticipantV2:read', 'chatRoomV2:read'])]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull]
    #[Groups(['chatParticipantV2:read', 'chatParticipantV2:write', 'chatRoomV2:read'])]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: ChatRoomV2::class, inversedBy: 'participants')]
    #[ORM\JoinColumn(nullable: false, name: 'chat_room_v2_id')]
    #[Assert\NotNull]
    #[Groups(['chatParticipantV2:read', 'chatParticipantV2:write'])]
    private ?ChatRoomV2 $chatRoom = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank]
    #[Assert\Choice(choices: ['admin', 'member'])]
    #[Groups(['chatParticipantV2:read', 'chatParticipantV2:write', 'chatRoomV2:read'])]
    private string $role = 'member';

    #[ORM\Column]
    #[Groups(['chatParticipantV2:read', 'chatRoomV2:read'])]
    private \DateTimeImmutable $joinedAt;

    #[ORM\Column(nullable: true)]
    #[Groups(['chatParticipantV2:read'])]
    private ?\DateTimeImmutable $deletedAt = null;

    #[ORM\OneToOne(targetEntity: ChatParticipantUnreadV2::class, mappedBy: 'chatParticipant', cascade: ['persist', 'remove'])]
    #[Groups(['chatParticipantV2:read', 'chatRoomV2:read'])]
    private ?ChatParticipantUnreadV2 $unread = null;

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

    public function getChatRoom(): ?ChatRoomV2
    {
        return $this->chatRoom;
    }

    public function setChatRoom(?ChatRoomV2 $chatRoom): static
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

    public function getDeletedAt(): ?\DateTimeImmutable
    {
        return $this->deletedAt;
    }

    public function setDeletedAt(?\DateTimeImmutable $deletedAt): static
    {
        $this->deletedAt = $deletedAt;

        return $this;
    }

    public function getUnread(): ?ChatParticipantUnreadV2
    {
        return $this->unread;
    }

    public function setUnread(?ChatParticipantUnreadV2 $unread): static
    {
        $this->unread = $unread;

        return $this;
    }

    public function softDelete(): static
    {
        $this->deletedAt = new \DateTimeImmutable();

        return $this;
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function restore(): static
    {
        $this->deletedAt = null;

        return $this;
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
