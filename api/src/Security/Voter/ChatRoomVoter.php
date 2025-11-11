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
 * - VIEW: User must be a participant OR room is public (auto-join)
 * - EDIT: User must be an admin of the room OR ROLE_ADMIN for public rooms
 * - DELETE: User must be an admin of the room OR ROLE_ADMIN for public rooms
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
            self::EDIT => $this->canEdit($chatRoom, $user),
            self::DELETE => $this->canDelete($chatRoom, $user),
            default => false,
        };
    }

    private function canView(ChatRoom $chatRoom, User $user): bool
    {
        // Public rooms are accessible to all authenticated users (auto-join)
        if ($chatRoom->getType() === 'public') {
            return true;
        }

        // Private and group rooms require explicit participation
        return $this->isParticipant($chatRoom, $user);
    }

    private function canEdit(ChatRoom $chatRoom, User $user): bool
    {
        // Global admins can edit any room
        if ($this->isGlobalAdmin($user)) {
            return true;
        }

        // Room participants with 'admin' role can edit
        return $this->isRoomAdmin($chatRoom, $user);
    }

    private function canDelete(ChatRoom $chatRoom, User $user): bool
    {
        // For PUBLIC rooms: only global admins (ROLE_ADMIN) can delete
        if ($chatRoom->getType() === 'public') {
            return $this->isGlobalAdmin($user);
        }

        // For private/group rooms: room admin can delete
        return $this->isRoomAdmin($chatRoom, $user);
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

    private function isRoomAdmin(ChatRoom $chatRoom, User $user): bool
    {
        foreach ($chatRoom->getParticipants() as $participant) {
            if ($participant->getUser() === $user && $participant->isAdmin()) {
                return true;
            }
        }

        return false;
    }

    private function isGlobalAdmin(User $user): bool
    {
        return in_array('ROLE_ADMIN', $user->getRoles(), true);
    }

    /**
     * @deprecated Use isRoomAdmin() instead
     */
    private function isAdmin(ChatRoom $chatRoom, User $user): bool
    {
        return $this->isRoomAdmin($chatRoom, $user);
    }
}
