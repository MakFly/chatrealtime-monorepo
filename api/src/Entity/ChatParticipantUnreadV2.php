<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'chat_participant_unread')]
class ChatParticipantUnreadV2
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\OneToOne(targetEntity: ChatParticipantV2::class, inversedBy: 'unread')]
    #[ORM\JoinColumn(nullable: false)]
    private ?ChatParticipantV2 $chatParticipant = null;

    #[ORM\Column(type: 'integer', options: ['default' => 0])]
    private int $unreadCount = 0;

    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $lastReadAt = null;

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getChatParticipant(): ?ChatParticipantV2
    {
        return $this->chatParticipant;
    }

    public function setChatParticipant(ChatParticipantV2 $chatParticipant): static
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
