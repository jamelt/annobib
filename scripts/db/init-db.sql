-- init-db.sql
-- Runs once when the PostgreSQL container is first created.
-- Only install extensions here; all schema (tables, enums, indexes)
-- is managed by Drizzle migrations via `scripts/migrate.ts up`.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
