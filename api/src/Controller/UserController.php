<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;

#[Route('/api/v1/user')]
class UserController extends AbstractController
{
    #[Route('/me', name: 'app_user_me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        if (!$user) {
            return $this->json([
                'error' => 'unauthorized',
                'message' => 'Non authentifié',
            ], Response::HTTP_UNAUTHORIZED);
        }

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'picture' => $user->getPicture(),
            'roles' => $user->getRoles(),
            'created_at' => $user->getCreatedAt()?->format('c'),
            'has_google_account' => $user->getGoogleId() !== null,
        ]);
    }

    #[Route('/me', name: 'app_user_update_me', methods: ['PUT'])]
    public function updateMe(
        Request $request,
        #[CurrentUser] ?User $user,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        if (!$user) {
            return $this->json([
                'error' => 'unauthorized',
                'message' => 'Non authentifié',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        // Mettre à jour le nom si fourni
        if (isset($data['name'])) {
            $user->setName($data['name']);
        }

        // Mettre à jour la photo de profil si fournie
        if (isset($data['picture'])) {
            $user->setPicture($data['picture']);
        }

        $entityManager->flush();

        return $this->json([
            'id' => $user->getId(),
            'email' => $user->getEmail(),
            'name' => $user->getName(),
            'picture' => $user->getPicture(),
            'roles' => $user->getRoles(),
            'created_at' => $user->getCreatedAt()?->format('c'),
            'has_google_account' => $user->getGoogleId() !== null,
        ]);
    }

    #[Route('/me/password', name: 'app_user_change_password', methods: ['POST'])]
    public function changePassword(
        Request $request,
        #[CurrentUser] ?User $user,
        UserPasswordHasherInterface $passwordHasher,
        EntityManagerInterface $entityManager
    ): JsonResponse {
        if (!$user) {
            return $this->json([
                'error' => 'unauthorized',
                'message' => 'Non authentifié',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        // Validation des champs requis
        if (!isset($data['current_password']) || !isset($data['new_password'])) {
            return $this->json([
                'error' => 'invalid_request',
                'message' => 'Mot de passe actuel et nouveau mot de passe requis',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier si l'utilisateur a un mot de passe (pas Google-only)
        if ($user->getPassword() === null) {
            return $this->json([
                'error' => 'no_password',
                'message' => 'Ce compte utilise uniquement Google Sign-In et n\'a pas de mot de passe',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérifier que le mot de passe actuel est correct
        if (!$passwordHasher->isPasswordValid($user, $data['current_password'])) {
            return $this->json([
                'error' => 'invalid_password',
                'message' => 'Mot de passe actuel incorrect',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Validation du nouveau mot de passe (minimum 8 caractères)
        if (strlen($data['new_password']) < 8) {
            return $this->json([
                'error' => 'password_too_short',
                'message' => 'Le nouveau mot de passe doit contenir au moins 8 caractères',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Mettre à jour le mot de passe
        $user->setPassword($passwordHasher->hashPassword($user, $data['new_password']));
        $entityManager->flush();

        return $this->json([
            'message' => 'Mot de passe mis à jour avec succès',
        ]);
    }
}
