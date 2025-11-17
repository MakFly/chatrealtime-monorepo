<?php

declare(strict_types=1);

namespace App\EventSubscriber;

use App\Entity\MessageV2;
use App\Service\V2\ChatUnreadV2ServiceInterface;
use Doctrine\Common\EventSubscriber;
use Doctrine\ORM\Events;
use Doctrine\Persistence\Event\LifecycleEventArgs;

class MessagePostV2Subscriber implements EventSubscriber
{
    public function __construct(
        private readonly ChatUnreadV2ServiceInterface $unreadService
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
        if (!$message instanceof MessageV2) {
            return;
        }

        $author = $message->getAuthor();
        $room = $message->getChatRoom();

        foreach ($room->getParticipants() as $participant) {
            if ($participant->getUser() !== $author) {
                $this->unreadService->incrementUnread($participant);
            }
        }
    }
}
