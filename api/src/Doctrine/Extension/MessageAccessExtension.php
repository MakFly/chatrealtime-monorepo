<?php

declare(strict_types=1);

namespace App\Doctrine\Extension;

use ApiPlatform\Doctrine\Orm\Extension\QueryCollectionExtensionInterface;
use ApiPlatform\Doctrine\Orm\Util\QueryNameGeneratorInterface;
use ApiPlatform\Metadata\Operation;
use App\Entity\Message;
use App\Entity\User;
use Doctrine\ORM\QueryBuilder;
use Symfony\Bundle\SecurityBundle\Security;

/**
 * Doctrine Extension to filter messages based on user access to chat rooms.
 *
 * This extension automatically restricts message queries to only return messages
 * from chat rooms where the current user has access:
 * - Chat rooms where the user is a participant (private/group)
 * - All public chat rooms (auto-join for all authenticated users)
 *
 * This is more efficient than using a Voter because it filters at the SQL level
 * instead of loading all messages and filtering them in PHP.
 */
final class MessageAccessExtension implements QueryCollectionExtensionInterface
{
    public function __construct(
        private readonly Security $security,
    ) {
    }

    public function applyToCollection(
        QueryBuilder $queryBuilder,
        QueryNameGeneratorInterface $queryNameGenerator,
        string $resourceClass,
        ?Operation $operation = null,
        array $context = []
    ): void {
        // Only apply to Message entity
        if ($resourceClass !== Message::class) {
            return;
        }

        $user = $this->security->getUser();

        // If no user is authenticated, don't return any messages
        if (!$user instanceof User) {
            $queryBuilder->andWhere('1 = 0'); // Always false
            return;
        }

        $rootAlias = $queryBuilder->getRootAliases()[0];
        $participantAlias = $queryNameGenerator->generateJoinAlias('participant');

        // Join with chat_participant to filter messages
        // Return messages where:
        // 1. User is a participant of the chat room (private/group rooms)
        // 2. OR the chat room is public (auto-join for all authenticated users)
        //
        // ✅ FIX: For public rooms, we don't need to check if user is a participant
        // We use a conditional LEFT JOIN to only join participants for the current user
        $queryBuilder
            ->innerJoin(sprintf('%s.chatRoom', $rootAlias), 'chatRoom')
            ->leftJoin(
                'chatRoom.participants',
                $participantAlias,
                'WITH',
                sprintf('%s.user = :currentUser', $participantAlias)
            )
            ->andWhere(
                $queryBuilder->expr()->orX(
                    sprintf('%s.id IS NOT NULL', $participantAlias), // User is a participant
                    'chatRoom.type = :publicType' // OR room is public
                )
            )
            ->setParameter('currentUser', $user)
            ->setParameter('publicType', 'public');
    }
}
