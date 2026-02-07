CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint
ALTER TABLE "document_chunks" ADD COLUMN IF NOT EXISTS "embedding" vector(1536);--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN IF NOT EXISTS "slug" text;
