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
    name: 'app:user:demote',
    description: 'Demote a user from admin role',
)]
class DemoteUserCommand extends Command
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
            ->setHelp('This command allows you to demote a user from admin role by email');
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

        if (!in_array('ROLE_ADMIN', $roles, true)) {
            $io->warning(sprintf('User "%s" is not an admin', $email));

            return Command::SUCCESS;
        }

        // Remove ROLE_ADMIN
        $roles = array_filter($roles, fn($role) => $role !== 'ROLE_ADMIN');
        $user->setRoles(array_values($roles));

        $this->entityManager->flush();

        $io->success(sprintf('User "%s" has been demoted from admin', $email));

        return Command::SUCCESS;
    }
}
