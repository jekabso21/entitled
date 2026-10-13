ALTER TABLE "install_settings" ADD COLUMN "portal_name" text DEFAULT 'Entitled' NOT NULL;--> statement-breakpoint
ALTER TABLE "install_settings" ADD COLUMN "primary_color" text DEFAULT 'indigo' NOT NULL;--> statement-breakpoint
ALTER TABLE "install_settings" ADD COLUMN "logo" bytea;--> statement-breakpoint
ALTER TABLE "install_settings" ADD COLUMN "logo_content_type" text;