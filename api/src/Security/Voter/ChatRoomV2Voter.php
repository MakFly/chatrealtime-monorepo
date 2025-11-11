<?php

declare(strict_types=1);

namespace App\Security\Voter;

use App\Entity\ChatRoomV2;
use App\Entity\User;
use Symfony\Component\Security\Core\Authentication\Token\TokenInterface;
use Symfony\Component\Security\Core\Authorization\Voter\Voter;

/**
 * Voter for ChatRoomV2 authorization.
 *
 * - VIEW: User must be a participant OR room is public (auto-join)
 * - EDIT: User must be an admin of the room OR ROLE_ADMIN for public rooms
 * - DELETE: User must be an admin of the room OR ROLE_ADMIN for public rooms
 */
final class ChatRoomV2Voter extends Voter
{
    public const VIEW = 'VIEW';
    public const EDIT = 'EDIT';
    public const DELETE = 'DELETE';

    protected function supports(string $attribute, mixed $subject): bool
    {
        if (!in_array($attribute, [self::VIEW, self::EDIT, self::DELETE], true)) {
            return false;
        }

        return $subject instanceof ChatRoomV2;
    }

    protected function voteOnAttribute(string $attribute, mixed $subject, TokenInterface $token): bool
    {
        $user = $token->getUser();

        if (!$user instanceof User) {
            return false;
        }

        /** @var ChatRoomV2 $chatRoom */
        $chatRoom = $subject;

        return match ($attribute) {
            self::VIEW => $this->canView($chatRoom, $user),
            self::EDIT => $this->canEdit($chatRoom, $user),
            self::DELETE => $this->canDelete($chatRoom, $user),
            default => false,
        };
    }

    private function canView(ChatRoomV2 $chatRoom, User $user): bool
    {
        // Public rooms are accessible to all authenticated users (auto-join)
        if ($chatRoom->getType() === 'public') {
            return true;
        }

        // Private and group rooms require explicit participation
        return $this->isParticipant($chatRoom, $user);
    }

    private function canEdit(ChatRoomV2 $chatRoom, User $user): bool
    {
        // Global admins can edit any room
        if ($this->isGlobalAdmin($user)) {
            return true;
        }

        // Room participants with 'admin' role can edit
        return $this->isRoomAdmin($chatRoom, $user);
    }

    private function canDelete(ChatRoomV2 $chatRoom, User $user): bool
    {
        // For PUBLIC rooms: only global admins (ROLE_ADMIN) can delete
        if ($chatRoom->getType() === 'public') {
            return $this->isGlobalAdmin($user);
        }

        // For private/group rooms: room admin can delete
        return $this->isRoomAdmin($chatRoom, $user);
    }

    private function isParticipant(ChatRoomV2 $chatRoom, User $user): bool
    {
        foreach ($chatRoom->getParticipants() as $participant) {
            if ($participant->getUser() === $user) {
                return true;
            }
        }

        return false;
    }

    private function isRoomAdmin(ChatRoomV2 $chatRoom, User $user): bool
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
}
