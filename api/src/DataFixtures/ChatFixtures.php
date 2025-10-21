<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\ChatParticipant;
use App\Entity\ChatRoom;
use App\Entity\Message;
use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

/**
 * Fixtures for Chat entities (ChatRoom, Message, ChatParticipant).
 */
final class ChatFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        // Create users for testing
        $user1 = new User();
        $user1->setEmail('chat.user1@test.com');
        $user1->setPassword(password_hash('password', PASSWORD_BCRYPT));
        $user1->setName('Chat User 1');
        $manager->persist($user1);

        $user2 = new User();
        $user2->setEmail('chat.user2@test.com');
        $user2->setPassword(password_hash('password', PASSWORD_BCRYPT));
        $user2->setName('Chat User 2');
        $manager->persist($user2);

        // Create a group chat room
        $groupRoom = new ChatRoom();
        $groupRoom->setName('General Discussion');
        $groupRoom->setType('group');
        $manager->persist($groupRoom);

        // Add participants to group room
        $participant1 = new ChatParticipant();
        $participant1->setUser($user1);
        $participant1->setChatRoom($groupRoom);
        $participant1->setRole('admin');
        $manager->persist($participant1);

        $participant2 = new ChatParticipant();
        $participant2->setUser($user2);
        $participant2->setChatRoom($groupRoom);
        $participant2->setRole('member');
        $manager->persist($participant2);

        // Create messages in group room
        $message1 = new Message();
        $message1->setAuthor($user1);
        $message1->setChatRoom($groupRoom);
        $message1->setContent('Hello everyone! Welcome to the chat.');
        $manager->persist($message1);

        // Wait a bit to have different timestamps
        sleep(1);

        $message2 = new Message();
        $message2->setAuthor($user2);
        $message2->setChatRoom($groupRoom);
        $message2->setContent('Hi! Thanks for having me here.');
        $manager->persist($message2);

        sleep(1);

        $message3 = new Message();
        $message3->setAuthor($user1);
        $message3->setChatRoom($groupRoom);
        $message3->setContent('How is everyone doing today?');
        $manager->persist($message3);

        // Create a direct chat room
        $directRoom = new ChatRoom();
        $directRoom->setName('Direct Chat');
        $directRoom->setType('direct');
        $manager->persist($directRoom);

        // Add participants to direct room
        $participant3 = new ChatParticipant();
        $participant3->setUser($user1);
        $participant3->setChatRoom($directRoom);
        $participant3->setRole('member');
        $manager->persist($participant3);

        $participant4 = new ChatParticipant();
        $participant4->setUser($user2);
        $participant4->setChatRoom($directRoom);
        $participant4->setRole('member');
        $manager->persist($participant4);

        // Create messages in direct room
        $message4 = new Message();
        $message4->setAuthor($user1);
        $message4->setChatRoom($directRoom);
        $message4->setContent('Hey, can we talk privately?');
        $manager->persist($message4);

        sleep(1);

        $message5 = new Message();
        $message5->setAuthor($user2);
        $message5->setChatRoom($directRoom);
        $message5->setContent('Sure, what\'s up?');
        $manager->persist($message5);

        // Create a public chat room
        $publicRoom = new ChatRoom();
        $publicRoom->setName('Public Announcements');
        $publicRoom->setType('public');
        $manager->persist($publicRoom);

        // Add participant to public room
        $participant5 = new ChatParticipant();
        $participant5->setUser($user1);
        $participant5->setChatRoom($publicRoom);
        $participant5->setRole('admin');
        $manager->persist($participant5);

        // Create message in public room
        $message6 = new Message();
        $message6->setAuthor($user1);
        $message6->setChatRoom($publicRoom);
        $message6->setContent('This is a public announcement channel.');
        $manager->persist($message6);

        $manager->flush();
    }
}
