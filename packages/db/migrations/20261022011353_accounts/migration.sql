CREATE TABLE "account_invitations" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"kind" text NOT NULL,
	"email" text NOT NULL,
	"token_hash" text NOT NULL UNIQUE,
	"vendor_role" text,
	"client_account_id" uuid,
	"client_role" text,
	"invited_by_user_id" uuid,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "account_invitations_kind_fields" CHECK (("kind" = 'vendor' and "vendor_role" is not null and "client_account_id" is null)
        or ("kind" = 'client' and "client_account_id" is not null and "client_role" is not null))
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"key" text NOT NULL UNIQUE,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "vendor_role" text;--> statement-breakpoint
CREATE INDEX "account_invitations_email_index" ON "account_invitations" ("email");--> statement-breakpoint
CREATE INDEX "account_invitations_client_account_id_index" ON "account_invitations" ("client_account_id");--> statement-breakpoint
ALTER TABLE "account_invitations" ADD CONSTRAINT "account_invitations_client_account_id_organizations_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "account_invitations" ADD CONSTRAINT "account_invitations_invited_by_user_id_users_id_fkey" FOREIGN KEY ("invited_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;