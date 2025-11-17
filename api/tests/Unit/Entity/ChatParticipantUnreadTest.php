<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity;

use App\Entity\ChatParticipantUnreadV2;
use App\Entity\ChatParticipantV2;
use PHPUnit\Framework\TestCase;

class ChatParticipantUnreadTest extends TestCase
{
    public function testConstructor(): void
    {
        $unread = new ChatParticipantUnreadV2();

        $this->assertNull($unread->getId());
        $this->assertSame(0, $unread->getUnreadCount());
        $this->assertNull($unread->getLastReadAt());
    }

    public function testSetGetChatParticipant(): void
    {
        $participant = $this->createMock(ChatParticipantV2::class);
        $unread = new ChatParticipantUnreadV2();

        $unread->setChatParticipant($participant);

        $this->assertSame($participant, $unread->getChatParticipant());
    }

    public function testSetGetUnreadCount(): void
    {
        $unread = new ChatParticipantUnreadV2();

        $unread->setUnreadCount(5);

        $this->assertSame(5, $unread->getUnreadCount());
    }

    public function testSetGetLastReadAt(): void
    {
        $date = new \DateTimeImmutable();
        $unread = new ChatParticipantUnreadV2();

        $unread->setLastReadAt($date);

        $this->assertSame($date, $unread->getLastReadAt());
    }
}
