<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\ChatRoom;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Voter for ChatRoom authorization.
 *
 * - VIEW: User must be a participant
 * - EDIT: User must be an admin of the room
 * - DELETE: User must be an admin of the room
 */
final class ChatRoomVoter extends Voter
{
    public const VIEW = 'VIEW';
    public const EDIT = 'EDIT';
    public const DELETE = 'DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)) {
            return false;
        }

        return $subject instanceof ChatRoom;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        /** @var ChatRoom $chatRoom */
        $chatRoom = $subject;

        return match ($attribute) {
            self::VIEW => $this->canView($chatRoom, $user),
            self::EDIT, self::DELETE => $this->canEdit($chatRoom, $user),
            default => false,
        };
    }

    private function canView(ChatRoom $chatRoom, User $user): bool
    {
        return $this->isParticipant($chatRoom, $user);
    }

    private function canEdit(ChatRoom $chatRoom, User $user): bool
    {
        return $this->isAdmin($chatRoom, $user);
    }

    private function isParticipant(ChatRoom $chatRoom, User $user): bool
    {
        foreach ($chatRoom->getParticipants() as $participant) {
            if ($participant->getUser() === $user) {
                return true;
            }
        }

        return false;
    }

    private function isAdmin(ChatRoom $chatRoom, User $user): bool
    {
        foreach ($chatRoom->getParticipants() as $participant) {
            if ($participant->getUser() === $user && $participant->isAdmin()) {
                return true;
            }
        }

        return false;
    }
}
