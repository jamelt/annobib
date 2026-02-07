-- Admin operations: roles, feedback, announcements, audit logs
DO $$ BEGIN
  CREATE TYPE "user_role" AS ENUM ('user', 'admin', 'support');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "feedback_type" AS ENUM ('bug', 'feature_request', 'general', 'complaint');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "feedback_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "announcement_type" AS ENUM ('info', 'warning', 'maintenance', 'release');
EXCEPTION WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" "user_role" DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_banned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "banned_reason" text;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "feedback" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "user_email" text,
  "type" "feedback_type" DEFAULT 'general' NOT NULL,
  "subject" text NOT NULL,
  "content" text NOT NULL,
  "status" "feedback_status" DEFAULT 'open' NOT NULL,
  "admin_notes" text,
  "resolved_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "announcements" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "created_by_id" uuid REFERENCES "users"("id") ON DELETE SET NULL,
  "title" text NOT NULL,
  "content" text NOT NULL,
  "type" "announcement_type" DEFAULT 'info' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "start_at" timestamp DEFAULT now() NOT NULL,
  "end_at" timestamp,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "admin_audit_logs" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "admin_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE SET NULL,
  "action" text NOT NULL,
  "target_type" text NOT NULL,
  "target_id" text,
  "details" jsonb,
  "ip_address" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "feedback_user_idx" ON "feedback" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "feedback_status_idx" ON "feedback" ("status");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_admin_idx" ON "admin_audit_logs" ("admin_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_action_idx" ON "admin_audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_target_idx" ON "admin_audit_logs" ("target_type", "target_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "audit_logs_created_at_idx" ON "admin_audit_logs" ("created_at");
