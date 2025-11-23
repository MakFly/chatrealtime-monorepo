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

        error_log('[MessagePostV2Subscriber] 📨 New message created, processing unread counts...');

        $author = $message->getAuthor();
        $room = $message->getChatRoom();

        error_log(sprintf('[MessagePostV2Subscriber] Room ID: %d, Author: %s (#%d)', $room->getId(), $author->getEmail(), $author->getId()));
        error_log(sprintf('[MessagePostV2Subscriber] Participants count: %d', $room->getParticipants()->count()));

        $incrementedCount = 0;
        foreach ($room->getParticipants() as $participant) {
            // Skip author
            if ($participant->getUser() === $author) {
                error_log(sprintf('[MessagePostV2Subscriber] ⏭️  Skipping author: %s', $participant->getUser()->getEmail()));
                continue;
            }

            // Skip soft-deleted participants (users who left the room)
            if ($participant->isDeleted()) {
                error_log(sprintf('[MessagePostV2Subscriber] ⏭️  Skipping soft-deleted participant: %s', $participant->getUser()->getEmail()));
                continue;
            }

            error_log(sprintf('[MessagePostV2Subscriber] ✅ Incrementing unread for user: %s (#%d)', $participant->getUser()->getEmail(), $participant->getUser()->getId()));
            $this->unreadService->incrementUnread($participant);
            $incrementedCount++;
        }

        error_log(sprintf('[MessagePostV2Subscriber] 📊 Incremented unread for %d participants', $incrementedCount));

        // Publish unread count updates via Mercure (excluding author)
        error_log('[MessagePostV2Subscriber] 📡 Publishing Mercure notifications...');
        $this->mercurePublisher->publishUnreadCountsForRoom($room, $author);
        error_log('[MessagePostV2Subscriber] ✅ MessagePostV2Subscriber completed');
    }
}
