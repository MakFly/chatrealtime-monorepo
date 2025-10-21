<?php

declare(strict_types=1);

namespace App\Tests\Unit\Security\Voter;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\User;
use App\Security\Voter\ChatRoomVoter;
use PHPUnit\Framework\TestCase;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\VoterInterface;

final class ChatRoomVoterTest extends TestCase
{
    private ChatRoomVoter $voter;

    protected function setUp(): void
    {
        $this->voter = new ChatRoomVoter();
    }

    public function testUserCanViewRoomIfParticipant(): void
    {
        $user = new User();
        $chatRoom = new ChatRoom();

        $participant = new ChatParticipant();
        $participant->setUser($user);
        $participant->setRole('member');
        $chatRoom->addParticipant($participant);

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, $chatRoom, ['VIEW']);

        $this->assertEquals(VoterInterface::ACCESS_GRANTED, $vote);
    }

    public function testUserCannotViewRoomIfNotParticipant(): void
    {
        $user = new User();
        $chatRoom = new ChatRoom();

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, $chatRoom, ['VIEW']);

        $this->assertEquals(VoterInterface::ACCESS_DENIED, $vote);
    }

    public function testAdminCanEditRoom(): void
    {
        $user = new User();
        $chatRoom = new ChatRoom();

        $participant = new ChatParticipant();
        $participant->setUser($user);
        $participant->setRole('admin');
        $chatRoom->addParticipant($participant);

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, $chatRoom, ['EDIT']);

        $this->assertEquals(VoterInterface::ACCESS_GRANTED, $vote);
    }

    public function testMemberCannotEditRoom(): void
    {
        $user = new User();
        $chatRoom = new ChatRoom();

        $participant = new ChatParticipant();
        $participant->setUser($user);
        $participant->setRole('member');
        $chatRoom->addParticipant($participant);

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, $chatRoom, ['EDIT']);

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
        $chatRoom = new ChatRoom();

        $token = $this->createMock(TokenInterface::class);
        $token->method('getUser')->willReturn($user);

        $vote = $this->voter->vote($token, $chatRoom, ['INVALID']);

        $this->assertEquals(VoterInterface::ACCESS_ABSTAIN, $vote);
    }
}
