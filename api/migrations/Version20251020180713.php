<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20251020180713 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add security fields to refresh_tokens: token_hash, rotation tracking, IP/User-Agent monitoring';
    }

    public function up(Schema $schema): void
    {
        // SECURITY ENHANCEMENT: Revoke all existing refresh tokens
        // Users will need to re-login to get new secure tokens with hashing
        // This is acceptable for a security upgrade - tokens are ephemeral
        $this->addSql('DELETE FROM refresh_tokens');

        // Add new security fields
        $this->addSql('ALTER TABLE refresh_tokens ADD rotated_from_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE refresh_tokens ADD token_hash VARCHAR(64) NOT NULL');
        $this->addSql('ALTER TABLE refresh_tokens ADD rotated_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE refresh_tokens ADD revoked_at TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL');
        $this->addSql('ALTER TABLE refresh_tokens ADD ip_address VARCHAR(45) DEFAULT NULL');
        $this->addSql('ALTER TABLE refresh_tokens ADD user_agent VARCHAR(500) DEFAULT NULL');
        $this->addSql('ALTER TABLE refresh_tokens ADD CONSTRAINT FK_9BACE7E17BE4BC82 FOREIGN KEY (rotated_from_id) REFERENCES refresh_tokens (id) ON DELETE SET NULL NOT DEFERRABLE INITIALLY IMMEDIATE');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_9BACE7E1B3BC57DA ON refresh_tokens (token_hash)');
        $this->addSql('CREATE INDEX IDX_9BACE7E17BE4BC82 ON refresh_tokens (rotated_from_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE SCHEMA public');
        $this->addSql('ALTER TABLE refresh_tokens DROP CONSTRAINT FK_9BACE7E17BE4BC82');
        $this->addSql('DROP INDEX UNIQ_9BACE7E1B3BC57DA');
        $this->addSql('DROP INDEX IDX_9BACE7E17BE4BC82');
        $this->addSql('ALTER TABLE refresh_tokens DROP rotated_from_id');
        $this->addSql('ALTER TABLE refresh_tokens DROP token_hash');
        $this->addSql('ALTER TABLE refresh_tokens DROP rotated_at');
        $this->addSql('ALTER TABLE refresh_tokens DROP revoked_at');
        $this->addSql('ALTER TABLE refresh_tokens DROP ip_address');
        $this->addSql('ALTER TABLE refresh_tokens DROP user_agent');
    }
}
