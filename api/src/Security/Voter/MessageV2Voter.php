<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\MessageV2;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Voter for MessageV2 authorization.
 *
 * - VIEW: User must be a participant of the chat room OR room is public (auto-join)
 * - DELETE: User must be the author of the message
 */
final class MessageV2Voter extends Voter
{
    public const VIEW = 'VIEW';
    public const DELETE = 'DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, [self::VIEW, self::DELETE], true)) {
            return false;
        }

        return $subject instanceof MessageV2;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        /** @var MessageV2 $message */
        $message = $subject;

        return match ($attribute) {
            self::VIEW => $this->canView($message, $user),
            self::DELETE => $this->canDelete($message, $user),
            default => false,
        };
    }

    private function canView(MessageV2 $message, User $user): bool
    {
        $chatRoom = $message->getChatRoom();

        if ($chatRoom === null) {
            return false;
        }

        // Public rooms are accessible to all authenticated users (auto-join)
        if ($chatRoom->getType() === 'public') {
            return true;
        }

        // Private and group rooms require explicit participation
        foreach ($chatRoom->getParticipants() as $participant) {
            if ($participant->getUser() === $user) {
                return true;
            }
        }

        return false;
    }

    private function canDelete(MessageV2 $message, User $user): bool
    {
        // User can delete only their own messages
        return $message->getAuthor() === $user;
    }
}
