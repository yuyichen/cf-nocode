-- Migration: 001_create_migration_table
-- Description: Create migration history table to track database schema changes

-- Up migration
CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    checksum TEXT NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_migrations_version ON migrations(version);

-- Down migration (for rollback)
-- DROP TABLE IF EXISTS migrations;
-- DROP INDEX IF EXISTS idx_migrations_version;
