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

        error_log('[MessagePostV1Subscriber] 📨 New message detected, processing unread counts...');

        $author = $message->getAuthor();
        $room = $message->getChatRoom();
        $participantCount = count($room->getParticipants());

        error_log(sprintf('[MessagePostV1Subscriber] Room ID: %d, Participants: %d, Author ID: %d',
            $room->getId(), $participantCount, $author->getId()));

        // Increment unread count for all participants except the author
        $incrementedCount = 0;
        foreach ($room->getParticipants() as $participant) {
            if ($participant->getUser() !== $author) {
                error_log(sprintf('[MessagePostV1Subscriber] Incrementing unread for user ID: %d',
                    $participant->getUser()->getId()));
                $this->unreadService->incrementUnread($participant);
                $incrementedCount++;
            }
        }

        error_log(sprintf('[MessagePostV1Subscriber] Incremented unread count for %d participants', $incrementedCount));

        // Publish unread counts via Mercure (excluding the author)
        error_log('[MessagePostV1Subscriber] Publishing to Mercure...');
        $this->mercurePublisher->publishUnreadCountsForRoom($room, $author);
        error_log('[MessagePostV1Subscriber] ✅ Processing complete');
    }
}
