<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251021174907 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE chat_participant (id SERIAL NOT NULL, user_id INT NOT NULL, chat_room_id INT NOT NULL, role VARCHAR(50) NOT NULL, joined_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_chat_participant_user ON chat_participant (user_id)');
        $this->addSql('CREATE INDEX idx_chat_participant_room ON chat_participant (chat_room_id)');
        $this->addSql('CREATE UNIQUE INDEX idx_chat_participant_unique ON chat_participant (user_id, chat_room_id)');
        $this->addSql('COMMENT ON COLUMN chat_participant.joined_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE chat_room (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, type VARCHAR(50) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN chat_room.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN chat_room.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE message (id SERIAL NOT NULL, author_id INT NOT NULL, chat_room_id INT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_B6BD307FF675F31B ON message (author_id)');
        $this->addSql('CREATE INDEX idx_message_chat_room ON message (chat_room_id)');
        $this->addSql('CREATE INDEX idx_message_created_at ON message (created_at)');
        $this->addSql('COMMENT ON COLUMN message.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE chat_participant ADD CONSTRAINT FK_E8ED9C89A76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE chat_participant ADD CONSTRAINT FK_E8ED9C891819BCFA FOREIGN KEY (chat_room_id) REFERENCES chat_room (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307FF675F31B FOREIGN KEY (author_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE message ADD CONSTRAINT FK_B6BD307F1819BCFA FOREIGN KEY (chat_room_id) REFERENCES chat_room (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE chat_participant DROP CONSTRAINT FK_E8ED9C89A76ED395');
        $this->addSql('ALTER TABLE chat_participant DROP CONSTRAINT FK_E8ED9C891819BCFA');
        $this->addSql('ALTER TABLE message DROP CONSTRAINT FK_B6BD307FF675F31B');
        $this->addSql('ALTER TABLE message DROP CONSTRAINT FK_B6BD307F1819BCFA');
        $this->addSql('DROP TABLE chat_participant');
        $this->addSql('DROP TABLE chat_room');
        $this->addSql('DROP TABLE message');
    }
}
