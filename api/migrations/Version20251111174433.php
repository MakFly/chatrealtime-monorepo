<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251111174433 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE chat_participant_v2 (id SERIAL NOT NULL, user_id INT NOT NULL, chat_room_v2_id INT NOT NULL, role VARCHAR(50) NOT NULL, joined_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX idx_chat_participant_v2_user ON chat_participant_v2 (user_id)');
        $this->addSql('CREATE INDEX idx_chat_participant_v2_room ON chat_participant_v2 (chat_room_v2_id)');
        $this->addSql('CREATE UNIQUE INDEX idx_chat_participant_v2_unique ON chat_participant_v2 (user_id, chat_room_v2_id)');
        $this->addSql('COMMENT ON COLUMN chat_participant_v2.joined_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE chat_room_v2 (id SERIAL NOT NULL, name VARCHAR(255) NOT NULL, type VARCHAR(50) NOT NULL, product_id INT NOT NULL, product_title VARCHAR(255) NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, updated_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('COMMENT ON COLUMN chat_room_v2.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('COMMENT ON COLUMN chat_room_v2.updated_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('CREATE TABLE message_v2 (id SERIAL NOT NULL, author_id INT NOT NULL, chat_room_v2_id INT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_1C28E976F675F31B ON message_v2 (author_id)');
        $this->addSql('CREATE INDEX idx_message_v2_chat_room ON message_v2 (chat_room_v2_id)');
        $this->addSql('CREATE INDEX idx_message_v2_created_at ON message_v2 (created_at)');
        $this->addSql('COMMENT ON COLUMN message_v2.created_at IS \'(DC2Type:datetime_immutable)\'');
        $this->addSql('ALTER TABLE chat_participant_v2 ADD CONSTRAINT FK_C4B8445BA76ED395 FOREIGN KEY (user_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE chat_participant_v2 ADD CONSTRAINT FK_C4B8445BFEDF2A77 FOREIGN KEY (chat_room_v2_id) REFERENCES chat_room_v2 (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE message_v2 ADD CONSTRAINT FK_1C28E976F675F31B FOREIGN KEY (author_id) REFERENCES "user" (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('ALTER TABLE message_v2 ADD CONSTRAINT FK_1C28E976FEDF2A77 FOREIGN KEY (chat_room_v2_id) REFERENCES chat_room_v2 (id) NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE chat_participant_v2 DROP CONSTRAINT FK_C4B8445BA76ED395');
        $this->addSql('ALTER TABLE chat_participant_v2 DROP CONSTRAINT FK_C4B8445BFEDF2A77');
        $this->addSql('ALTER TABLE message_v2 DROP CONSTRAINT FK_1C28E976F675F31B');
        $this->addSql('ALTER TABLE message_v2 DROP CONSTRAINT FK_1C28E976FEDF2A77');
        $this->addSql('DROP TABLE chat_participant_v2');
        $this->addSql('DROP TABLE chat_room_v2');
        $this->addSql('DROP TABLE message_v2');
    }
}
