<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ChatParticipantV2;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ChatParticipantV2>
 */
class ChatParticipantV2Repository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ChatParticipantV2::class);
    }

    // Custom queries can be added here if needed
}
