<?php

declare(strict_types=1);

namespace App\Command;

use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:user:promote',
    description: 'Promote a user to admin role',
)]
class PromoteUserCommand extends Command
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $entityManager,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'User email')
            ->setHelp('This command allows you to promote a user to admin role by email');
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $email = $input->getArgument('email');

        $user = $this->userRepository->findOneBy(['email' => $email]);

        if (!$user) {
            $io->error(sprintf('User with email "%s" not found', $email));

            return Command::FAILURE;
        }

        $roles = $user->getRoles();

        if (in_array('ROLE_ADMIN', $roles, true)) {
            $io->warning(sprintf('User "%s" is already an admin', $email));

            return Command::SUCCESS;
        }

        // Add ROLE_ADMIN
        $roles[] = 'ROLE_ADMIN';
        $user->setRoles($roles);

        $this->entityManager->flush();

        $io->success(sprintf('User "%s" has been promoted to admin', $email));

        return Command::SUCCESS;
    }
}
