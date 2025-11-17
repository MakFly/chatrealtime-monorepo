<?php

declare(strict_types=1);

namespace App\Controller\V2;

use App\Entity\User;
use App\Service\V2\MercureJwtGeneratorV2;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Attribute\AsController;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[AsController]
#[Route('/api/v2')]
class MercureTokenV2Controller extends AbstractController
{
    public function __construct(
        private readonly MercureJwtGeneratorV2 $mercureJwtGeneratorV2
    ) {
    }

    /**
     * Generate a Mercure JWT token for the current user (v2 topics).
     *
     * The token includes subscribe permissions for all accessible chat rooms.
     */
    #[Route('/mercure/token', name: 'mercure_token_v2', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function getToken(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $token = $this->mercureJwtGeneratorV2->generateToken($user);

        return $this->json([
            'token' => $token,
            'expiresIn' => 21600, // 6 hours in seconds
        ]);
    }
}
