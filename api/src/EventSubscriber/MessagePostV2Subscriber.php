<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\MessageV2;
use App\Service\V2\ChatUnreadV2ServiceInterface;
use App\Service\V2\ChatUnreadMercurePublisherV2;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;

class MessagePostV2Subscriber implements EventSubscriber
{
    public function __construct(
        private readonly ChatUnreadV2ServiceInterface $unreadService,
        private readonly ChatUnreadMercurePublisherV2 $mercurePublisher
    ) {
        error_log('[MessagePostV2Subscriber] 🏗️ Constructor called - Subscriber instantiated');
    }

    public function getSubscribedEvents(): array
    {
        error_log('[MessagePostV2Subscriber] 📋 getSubscribedEvents() called');
        return [
            Events::postPersist => 'postPersist',
        ];
    }

    public function postPersist(LifecycleEventArgs $event): void
    {
        $message = $event->getObject();
        if (!$message instanceof MessageV2) {
            return;
        }

        // Unread/publish logic is already handled in MessageV2Processor; avoid double-processing.
        return;
    }
}
