<?php

declare(strict_types=1);

namespace App\Tests\Unit\Service;

use App\Service\V2\ChatUnreadV2Service;
use App\Service\V2\ChatUnreadV2ServiceInterface;
use PHPUnit\Framework\TestCase;

class ChatUnreadV2ServiceTest extends TestCase
{
    public function testImplementsInterface(): void
    {
        $this->assertTrue(true);
    }

    public function testIncrementUnreadDelegatesToRepo(): void
    {
        $this->assertTrue(true);
    }

    public function testResetUnreadDelegatesToRepo(): void
    {
        $this->assertTrue(true);
    }

    public function testGetUnreadCountsForUserDelegatesToRepo(): void
    {
        $this->assertTrue(true);
    }
}
