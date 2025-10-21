<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class ChatParticipantTest extends TestCase
{
    public function testCanCreateChatParticipant(): void
    {
        $participant = new ChatParticipant();

        $this->assertInstanceOf(ChatParticipant::class, $participant);
    }

    public function testChatParticipantHasId(): void
    {
        $participant = new ChatParticipant();

        $this->assertNull($participant->getId());
    }

    public function testChatParticipantHasUser(): void
    {
        $participant = new ChatParticipant();
        $user = new User();

        $participant->setUser($user);

        $this->assertSame($user, $participant->getUser());
    }

    public function testChatParticipantBelongsToChatRoom(): void
    {
        $participant = new ChatParticipant();
        $chatRoom = new ChatRoom();

        $participant->setChatRoom($chatRoom);

        $this->assertSame($chatRoom, $participant->getChatRoom());
    }

    public function testChatParticipantHasRole(): void
    {
        $participant = new ChatParticipant();

        $participant->setRole('admin');
        $this->assertEquals('admin', $participant->getRole());

        $participant->setRole('member');
        $this->assertEquals('member', $participant->getRole());
    }

    public function testChatParticipantHasJoinedAtTimestamp(): void
    {
        $participant = new ChatParticipant();

        $this->assertInstanceOf(\DateTimeImmutable::class, $participant->getJoinedAt());
    }

    public function testIsAdmin(): void
    {
        $participant = new ChatParticipant();

        $participant->setRole('admin');
        $this->assertTrue($participant->isAdmin());

        $participant->setRole('member');
        $this->assertFalse($participant->isAdmin());
    }
}
