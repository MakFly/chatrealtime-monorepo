<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\Message;
use App\Service\V1\ChatUnreadV1Service;
use App\Service\V1\ChatUnreadMercurePublisher;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;

class MessagePostV1Subscriber implements EventSubscriber
{
    public function __construct(
        private readonly ChatUnreadV1Service $unreadService,
        private readonly ChatUnreadMercurePublisher $mercurePublisher
    ) {
    }

    public function getSubscribedEvents(): array
    {
        return [
            Events::postPersist => 'postPersist',
        ];
    }

    public function postPersist(LifecycleEventArgs $event): void
    {
        $message = $event->getObject();
        if (!$message instanceof Message) {
            return;
        }

        // Unread/publish logic is handled in MessageProcessor; avoid double-processing.
        return;
    }
}
