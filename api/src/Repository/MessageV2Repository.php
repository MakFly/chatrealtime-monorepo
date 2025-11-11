<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\MessageV2;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<MessageV2>
 */
class MessageV2Repository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, MessageV2::class);
    }

    // Custom queries can be added here if needed
}
