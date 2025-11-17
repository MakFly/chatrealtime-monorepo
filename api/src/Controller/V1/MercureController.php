<?php

declare(strict_types=1);

namespace App\Controller\V1;

use App\Entity\User;
use App\Service\V1\MercureJwtGenerator;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/v1')]
class MercureController extends AbstractController
{
    public function __construct(
        private readonly MercureJwtGenerator $mercureJwtGenerator,
    ) {
    }

    /**
     * Get a Mercure JWT token for the authenticated user.
     *
     * The token includes subscribe claims for all chat rooms where the user is a participant.
     */
    #[Route('/mercure/token', name: 'api_mercure_token', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getToken(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $token = $this->mercureJwtGenerator->generateToken($user);

        return new JsonResponse([
            'token' => $token,
        ]);
    }
}
