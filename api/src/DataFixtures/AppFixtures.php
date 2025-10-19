<?php

declare(strict_types=1);

namespace App\DataFixtures;

use App\Entity\User;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $passwordHasher
    ) {
    }

    public function load(ObjectManager $manager): void
    {
        // Utilisateur 1 : Authentification email/password classique
        $user1 = new User();
        $user1->setEmail('user@test.com');
        $user1->setPassword($this->passwordHasher->hashPassword($user1, 'password123'));
        $user1->setName('Utilisateur Test');
        $user1->setRoles(['ROLE_USER']);
        $manager->persist($user1);

        // Utilisateur 2 : Google SSO uniquement (pas de password)
        $user2 = new User();
        $user2->setEmail('google.user@test.com');
        $user2->setName('Google User');
        $user2->setGoogleId('123456789012345678901'); // Google ID de test
        $user2->setPicture('https://lh3.googleusercontent.com/a/default-user');
        $user2->setGoogleAccessToken('fake-google-access-token-for-testing');
        $user2->setRoles(['ROLE_USER']);
        $manager->persist($user2);

        // Utilisateur 3 : Les deux méthodes (email/password + Google SSO)
        $user3 = new User();
        $user3->setEmail('hybrid@test.com');
        $user3->setPassword($this->passwordHasher->hashPassword($user3, 'password123'));
        $user3->setName('Hybrid User');
        $user3->setGoogleId('987654321098765432109'); // Google ID de test
        $user3->setPicture('https://lh3.googleusercontent.com/a/hybrid-user');
        $user3->setGoogleAccessToken('fake-google-access-token-hybrid');
        $user3->setRoles(['ROLE_USER']);
        $manager->persist($user3);

        // Utilisateur 4 : Admin avec email/password
        $admin = new User();
        $admin->setEmail('admin@test.com');
        $admin->setPassword($this->passwordHasher->hashPassword($admin, 'admin123'));
        $admin->setName('Administrateur');
        $admin->setRoles(['ROLE_USER', 'ROLE_ADMIN']);
        $manager->persist($admin);

        $manager->flush();
    }
}
