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
 * Doctrine Extension to filter messages based on user participation in chat rooms.
 *
 * This extension automatically restricts message queries to only return messages
 * from chat rooms where the current user is a participant.
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
        // Only return messages where the user is a participant of the chat room
        $queryBuilder
            ->innerJoin(sprintf('%s.chatRoom', $rootAlias), 'chatRoom')
            ->innerJoin('chatRoom.participants', $participantAlias)
            ->andWhere(sprintf('%s.user = :currentUser', $participantAlias))
            ->setParameter('currentUser', $user);
    }
}
