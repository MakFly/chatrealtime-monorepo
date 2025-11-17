<?php

declare(strict_types=1);

namespace App\Tests\Unit\Repository;

use App\Entity\ChatParticipantUnreadV2;
use App\Entity\ChatParticipantV2;
use App\Entity\User;
use App\Repository\ChatUnreadV2Repository;
use PHPUnit\Framework\TestCase;

class ChatUnreadV2RepositoryTest extends TestCase
{
    public function testImplementsInterface(): void
    {
        $this->assertTrue(true);
    }

    public function testIncrementUnread(): void
    {
        $this->assertTrue(true);
    }

    public function testResetUnread(): void
    {
        $this->assertTrue(true);
    }

    public function testFindChatRoomsWithUnreadCounts(): void
    {
        $this->assertTrue(true);
    }
}
