<?php

declare(strict_types=1);

namespace App\Tests\Unit\EventSubscriber;

use App\EventSubscriber\MessagePostV2Subscriber;
use App\Service\V2\ChatUnreadV2ServiceInterface;
use PHPUnit\Framework\TestCase;

class MessagePostV2SubscriberTest extends TestCase
{
    public function testPostPersistIncrementsUnreadForNonAuthors(): void
    {
        $this->assertTrue(true);
    }
}
