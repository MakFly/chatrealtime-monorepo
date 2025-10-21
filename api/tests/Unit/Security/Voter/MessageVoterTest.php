<?php

declare(strict_types=1);

namespace App\Tests\Unit\Security\Voter;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\Message;
use App\Entity\User;
use App\Security\Voter\MessageVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\VoterInterface;

final class MessageVoterTest extends TestCase
{
    private MessageVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new MessageVoter();
    }

    public function testUserCanViewMessageIfParticipantOfRoom(): void
    {
        $user = new User();
        $chatRoom = new ChatRoom();
        $message = new Message();
        $message->setChatRoom($chatRoom);

        $participant = new ChatParticipant();
        $participant->setUser($user);
        $chatRoom->addParticipant($participant);

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, $message, ['VIEW']);

        $this->assertEquals(VoterInterface::ACCESS_GRANTED, $vote);
    }

    public function testUserCannotViewMessageIfNotParticipantOfRoom(): void
    {
        $user = new User();
        $chatRoom = new ChatRoom();
        $message = new Message();
        $message->setChatRoom($chatRoom);

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, $message, ['VIEW']);

        $this->assertEquals(VoterInterface::ACCESS_DENIED, $vote);
    }

    public function testAuthorCanDeleteOwnMessage(): void
    {
        $author = new User();
        $chatRoom = new ChatRoom();
        $message = new Message();
        $message->setAuthor($author);
        $message->setChatRoom($chatRoom);

        $participant = new ChatParticipant();
        $participant->setUser($author);
        $chatRoom->addParticipant($participant);

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($author);

        $vote = $this->voter->vote($token, $message, ['DELETE']);

        $this->assertEquals(VoterInterface::ACCESS_GRANTED, $vote);
    }

    public function testUserCannotDeleteOthersMessage(): void
    {
        $author = new User();
        $otherUser = new User();
        $chatRoom = new ChatRoom();
        $message = new Message();
        $message->setAuthor($author);
        $message->setChatRoom($chatRoom);

        $participant = new ChatParticipant();
        $participant->setUser($otherUser);
        $chatRoom->addParticipant($participant);

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($otherUser);

        $vote = $this->voter->vote($token, $message, ['DELETE']);

        $this->assertEquals(VoterInterface::ACCESS_DENIED, $vote);
    }

    public function testAbstainsOnInvalidSubject(): void
    {
        $user = new User();
        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, new \stdClass(), ['VIEW']);

        $this->assertEquals(VoterInterface::ACCESS_ABSTAIN, $vote);
    }

    public function testAbstainsOnInvalidAttribute(): void
    {
        $user = new User();
        $message = new Message();

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, $message, ['INVALID']);

        $this->assertEquals(VoterInterface::ACCESS_ABSTAIN, $vote);
    }
}
