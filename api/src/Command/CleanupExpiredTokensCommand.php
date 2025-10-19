<?php

declare(strict_types=1);

namespace App\Command;

use Gesdinet\JWTRefreshTokenBundle\Model\RefreshTokenManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:cleanup-expired-tokens',
    description: 'Supprime les refresh tokens expirés de la base de données',
)]
class CleanupExpiredTokensCommand extends Command
{
    public function __construct(
        private RefreshTokenManagerInterface $refreshTokenManager,
    ) {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $io->title('Nettoyage des refresh tokens expirés');

        try {
            $deletedCount = $this->refreshTokenManager->revokeAllInvalid();

            $io->success(sprintf(
                '%d refresh token(s) expiré(s) supprimé(s) avec succès.',
                $deletedCount
            ));

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error('Erreur lors du nettoyage des tokens : ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
