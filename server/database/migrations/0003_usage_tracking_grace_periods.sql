-- Usage tracking and grace period support

-- Add grace period and pricing columns to subscriptions
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "grace_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "last_payment_error" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "unit_amount" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN IF NOT EXISTS "billing_interval" text;--> statement-breakpoint

-- Create API usage tracking table
CREATE TABLE IF NOT EXISTS "api_usage_daily" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "date" date NOT NULL,
  "request_count" integer DEFAULT 0 NOT NULL,
  "endpoint_counts" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "api_usage_user_date_idx" ON "api_usage_daily" ("user_id", "date");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_usage_date_idx" ON "api_usage_daily" ("date");
