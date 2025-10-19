<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

class GoogleUserProvisioner
{
    public function __construct(
        private UserRepository $userRepository,
        private EntityManagerInterface $entityManager,
    ) {
    }

    /**
     * Provisionne ou met à jour un utilisateur à partir des données Google.
     *
     * @throws ConflictHttpException Si l'email existe avec un Google ID différent
     */
    public function provisionUser(
        string $googleId,
        string $email,
        ?string $name = null,
        ?string $picture = null,
        ?string $googleAccessToken = null,
        ?string $googleRefreshToken = null
    ): User {
        // Chercher l'utilisateur par email
        $user = $this->userRepository->findOneBy(['email' => $email]);

        if ($user) {
            return $this->handleExistingUser($user, $googleId, $name, $picture, $googleAccessToken, $googleRefreshToken);
        }

        // Créer un nouvel utilisateur
        return $this->createNewUser($googleId, $email, $name, $picture, $googleAccessToken, $googleRefreshToken);
    }

    private function handleExistingUser(
        User $user,
        string $googleId,
        ?string $name,
        ?string $picture,
        ?string $googleAccessToken,
        ?string $googleRefreshToken
    ): User {
        // Si l'utilisateur existe sans Google ID, on lie le compte
        if ($user->getGoogleId() === null) {
            $user->setGoogleId($googleId);
            $user->setGoogleAccessToken($googleAccessToken);
            $user->setGoogleRefreshToken($googleRefreshToken);

            // Mettre à jour le profil si les données sont fournies
            if ($name !== null) {
                $user->setName($name);
            }
            if ($picture !== null) {
                $user->setPicture($picture);
            }

            $this->entityManager->flush();

            return $user;
        }

        // Si l'utilisateur existe avec un Google ID différent, c'est un conflit de sécurité
        if ($user->getGoogleId() !== $googleId) {
            throw new ConflictHttpException(
                'Cet email est déjà lié à un autre compte Google'
            );
        }

        // L'utilisateur existe avec le même Google ID : mettre à jour les tokens et le profil
        $user->setGoogleAccessToken($googleAccessToken);
        $user->setGoogleRefreshToken($googleRefreshToken);

        // Synchroniser les données du profil depuis Google
        if ($name !== null) {
            $user->setName($name);
        }
        if ($picture !== null) {
            $user->setPicture($picture);
        }

        $this->entityManager->flush();

        return $user;
    }

    private function createNewUser(
        string $googleId,
        string $email,
        ?string $name,
        ?string $picture,
        ?string $googleAccessToken,
        ?string $googleRefreshToken
    ): User {
        $user = new User();
        $user->setEmail($email);
        $user->setGoogleId($googleId);
        $user->setName($name);
        $user->setPicture($picture);
        $user->setGoogleAccessToken($googleAccessToken);
        $user->setGoogleRefreshToken($googleRefreshToken);
        // Pas de mot de passe pour les utilisateurs Google uniquement
        $user->setPassword(null);

        $this->entityManager->persist($user);
        $this->entityManager->flush();

        return $user;
    }
}
