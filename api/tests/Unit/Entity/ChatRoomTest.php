<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\Message;
use PHPUnit\Framework\TestCase;

/**
 * TDD: ChatRoom Entity Tests
 *
 * Following strict TDD approach:
 * 1. Write test (RED)
 * 2. Implement minimum code (GREEN)
 * 3. Refactor (REFACTOR)
 */
final class ChatRoomTest extends TestCase
{
    public function testCanCreateChatRoom(): void
    {
        $chatRoom = new ChatRoom();
        $chatRoom->setName('General Chat');
        $chatRoom->setType('group');

        $this->assertInstanceOf(ChatRoom::class, $chatRoom);
        $this->assertEquals('General Chat', $chatRoom->getName());
        $this->assertEquals('group', $chatRoom->getType());
    }

    public function testChatRoomHasId(): void
    {
        $chatRoom = new ChatRoom();

        $this->assertNull($chatRoom->getId());
    }

    public function testChatRoomTypeValidation(): void
    {
        $chatRoom = new ChatRoom();

        // Valid types
        $chatRoom->setType('direct');
        $this->assertEquals('direct', $chatRoom->getType());

        $chatRoom->setType('group');
        $this->assertEquals('group', $chatRoom->getType());

        $chatRoom->setType('public');
        $this->assertEquals('public', $chatRoom->getType());
    }

    public function testChatRoomHasTimestamps(): void
    {
        $chatRoom = new ChatRoom();

        $this->assertInstanceOf(\DateTimeImmutable::class, $chatRoom->getCreatedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $chatRoom->getUpdatedAt());
    }

    public function testChatRoomCanHaveMessages(): void
    {
        $chatRoom = new ChatRoom();

        $this->assertCount(0, $chatRoom->getMessages());

        $message = new Message();
        $chatRoom->addMessage($message);

        $this->assertCount(1, $chatRoom->getMessages());
        $this->assertTrue($chatRoom->getMessages()->contains($message));
    }

    public function testChatRoomCanRemoveMessage(): void
    {
        $chatRoom = new ChatRoom();
        $message = new Message();

        $chatRoom->addMessage($message);
        $this->assertCount(1, $chatRoom->getMessages());

        $chatRoom->removeMessage($message);
        $this->assertCount(0, $chatRoom->getMessages());
    }

    public function testChatRoomCanHaveParticipants(): void
    {
        $chatRoom = new ChatRoom();

        $this->assertCount(0, $chatRoom->getParticipants());

        $participant = new ChatParticipant();
        $chatRoom->addParticipant($participant);

        $this->assertCount(1, $chatRoom->getParticipants());
        $this->assertTrue($chatRoom->getParticipants()->contains($participant));
    }

    public function testChatRoomCanRemoveParticipant(): void
    {
        $chatRoom = new ChatRoom();
        $participant = new ChatParticipant();

        $chatRoom->addParticipant($participant);
        $this->assertCount(1, $chatRoom->getParticipants());

        $chatRoom->removeParticipant($participant);
        $this->assertCount(0, $chatRoom->getParticipants());
    }

    public function testUpdatedAtIsUpdatedOnModification(): void
    {
        $chatRoom = new ChatRoom();
        $initialUpdatedAt = $chatRoom->getUpdatedAt();

        sleep(1);
        $chatRoom->setName('Updated Name');

        // Should trigger prePersist/preUpdate in real doctrine context
        $this->assertNotEquals($initialUpdatedAt, $chatRoom->getUpdatedAt());
    }
}
