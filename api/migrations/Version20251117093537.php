<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251117093537 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE chat_participant_unread (id SERIAL NOT NULL, chat_participant_id INT NOT NULL, unread_count INT DEFAULT 0 NOT NULL, last_read_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_38AA9EA58BEABE04 ON chat_participant_unread (chat_participant_id)');
        $this->addSql('COMMENT ON COLUMN chat_participant_unread.last_read_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE chat_participant_unread ADD CONSTRAINT FK_38AA9EA58BEABE04 FOREIGN KEY (chat_participant_id) REFERENCES chat_participant_v2 (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE chat_participant_unread DROP CONSTRAINT FK_38AA9EA58BEABE04');
        $this->addSql('DROP TABLE chat_participant_unread');
    }
}
