CREATE TABLE "install_settings" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"auto_publish_releases" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "install_settings_single_row" CHECK ("id" = 1)
);
--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "artifacts" ADD COLUMN "expected_sha256" text;--> statement-breakpoint
ALTER TABLE "artifacts" ALTER COLUMN "sha256" DROP NOT NULL;