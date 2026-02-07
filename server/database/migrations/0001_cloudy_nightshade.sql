ALTER TABLE "document_chunks" ADD COLUMN "embedding" "vector(1536)";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "slug" text;
