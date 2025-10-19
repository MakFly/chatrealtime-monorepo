<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Gesdinet\JWTRefreshTokenBundle\Model\AbstractRefreshToken;

#[ORM\Entity(repositoryClass: 'App\Repository\RefreshTokenRepository')]
#[ORM\Table(name: 'refresh_tokens')]
class RefreshToken extends AbstractRefreshToken
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column(type: 'integer')]
    protected $id;

    #[ORM\Column(type: 'string', length: 128, unique: true, name: 'refresh_token')]
    protected $refreshToken;

    #[ORM\Column(type: 'string', length: 255)]
    protected $username;

    #[ORM\Column(type: 'datetime')]
    protected $valid;
}
