<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity]
#[ORM\Table(name: 'chat_participant_unread_v1')]
class ChatParticipantUnreadV1
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: ChatParticipant::class, inversedBy: 'unread')]
    #[ORM\JoinColumn(nullable: false)]
    private ?ChatParticipant $chatParticipant = null;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    #[Groups(['chatRoom:read', 'chatParticipant:read'])]
    private int $unreadCount = 0;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    #[Groups(['chatRoom:read', 'chatParticipant:read'])]
    private ?\DateTimeImmutable $lastReadAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getChatParticipant(): ?ChatParticipant
    {
        return $this->chatParticipant;
    }

    public function setChatParticipant(ChatParticipant $chatParticipant): static
    {
        $this->chatParticipant = $chatParticipant;

        return $this;
    }

    public function getUnreadCount(): int
    {
        return $this->unreadCount;
    }

    public function setUnreadCount(int $unreadCount): static
    {
        $this->unreadCount = $unreadCount;

        return $this;
    }

    public function getLastReadAt(): ?\DateTimeImmutable
    {
        return $this->lastReadAt;
    }

    public function setLastReadAt(?\DateTimeImmutable $lastReadAt): static
    {
        $this->lastReadAt = $lastReadAt;

        return $this;
    }
}
