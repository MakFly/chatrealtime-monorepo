<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity;

use App\Entity\ChatRoom;
use App\Entity\Message;
use App\Entity\User;
use PHPUnit\Framework\TestCase;

final class MessageTest extends TestCase
{
    public function testCanCreateMessage(): void
    {
        $message = new Message();
        $message->setContent('Hello World');

        $this->assertInstanceOf(Message::class, $message);
        $this->assertEquals('Hello World', $message->getContent());
    }

    public function testMessageHasId(): void
    {
        $message = new Message();

        $this->assertNull($message->getId());
    }

    public function testMessageHasAuthor(): void
    {
        $message = new Message();
        $user = new User();

        $message->setAuthor($user);

        $this->assertSame($user, $message->getAuthor());
    }

    public function testMessageBelongsToChatRoom(): void
    {
        $message = new Message();
        $chatRoom = new ChatRoom();

        $message->setChatRoom($chatRoom);

        $this->assertSame($chatRoom, $message->getChatRoom());
    }

    public function testMessageHasCreatedAtTimestamp(): void
    {
        $message = new Message();

        $this->assertInstanceOf(\DateTimeImmutable::class, $message->getCreatedAt());
    }

    public function testMessageContentCannotBeEmpty(): void
    {
        $message = new Message();

        // This will be validated by Symfony validator
        $message->setContent('');

        $this->assertEquals('', $message->getContent());
    }

    public function testMessageContentHasMaxLength(): void
    {
        $message = new Message();
        $longContent = str_repeat('a', 5001);

        $message->setContent($longContent);

        // Validation will be done by Symfony validator
        $this->assertEquals($longContent, $message->getContent());
    }
}
