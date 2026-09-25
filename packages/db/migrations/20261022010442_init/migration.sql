CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"actor_user_id" uuid,
	"actor_api_key_id" uuid,
	"action" text NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid,
	"metadata" jsonb DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "apikeys" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"config_id" text DEFAULT 'default' NOT NULL,
	"name" text,
	"start" text,
	"reference_id" text NOT NULL,
	"prefix" text,
	"key" text NOT NULL,
	"refill_interval" integer,
	"refill_amount" integer,
	"last_refill_at" timestamp,
	"enabled" boolean DEFAULT true,
	"rate_limit_enabled" boolean DEFAULT true,
	"rate_limit_time_window" integer DEFAULT 86400000,
	"rate_limit_max" integer DEFAULT 10,
	"request_count" integer DEFAULT 0,
	"remaining" integer,
	"last_request" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"permissions" text,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"inviter_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"organization_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"name" text NOT NULL,
	"slug" text NOT NULL UNIQUE,
	"logo" text,
	"created_at" timestamp NOT NULL,
	"metadata" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"active_organization_id" text
);
--> statement-breakpoint
CREATE TABLE "two_factors" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" uuid NOT NULL,
	"verified" boolean DEFAULT true,
	"failed_verification_count" integer DEFAULT 0,
	"locked_until" timestamp
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"name" text NOT NULL,
	"email" text NOT NULL UNIQUE,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"two_factor_enabled" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid(),
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hardware_revisions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"product_id" uuid NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hardware_revisions_product_id_code_unique" UNIQUE("product_id","code"),
	CONSTRAINT "hardware_revisions_product_id_position_unique" UNIQUE("product_id","position")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"slug" text NOT NULL UNIQUE,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "entitlement_revisions" (
	"entitlement_id" uuid,
	"revision_id" uuid,
	CONSTRAINT "entitlement_revisions_pkey" PRIMARY KEY("entitlement_id","revision_id")
);
--> statement-breakpoint
CREATE TABLE "entitlements" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"client_account_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "entitlements_client_account_id_product_id_unique" UNIQUE("client_account_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "artifacts" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"release_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"sha256" text NOT NULL,
	"storage_key" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "releases" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"product_id" uuid NOT NULL,
	"version" text NOT NULL,
	"title" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"changelog" text DEFAULT '' NOT NULL,
	"install_instructions" text DEFAULT '' NOT NULL,
	"min_revision_id" uuid,
	"max_revision_id" uuid,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "releases_product_id_version_unique" UNIQUE("product_id","version")
);
--> statement-breakpoint
CREATE INDEX "audit_log_subject_type_subject_id_index" ON "audit_log" ("subject_type","subject_id");--> statement-breakpoint
CREATE INDEX "audit_log_created_at_index" ON "audit_log" ("created_at");--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" ("user_id");--> statement-breakpoint
CREATE INDEX "apikeys_configId_idx" ON "apikeys" ("config_id");--> statement-breakpoint
CREATE INDEX "apikeys_referenceId_idx" ON "apikeys" ("reference_id");--> statement-breakpoint
CREATE INDEX "apikeys_key_idx" ON "apikeys" ("key");--> statement-breakpoint
CREATE INDEX "invitations_organizationId_idx" ON "invitations" ("organization_id");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" ("email");--> statement-breakpoint
CREATE INDEX "members_organizationId_idx" ON "members" ("organization_id");--> statement-breakpoint
CREATE INDEX "members_userId_idx" ON "members" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_uidx" ON "organizations" ("slug");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" ("user_id");--> statement-breakpoint
CREATE INDEX "twoFactors_secret_idx" ON "two_factors" ("secret");--> statement-breakpoint
CREATE INDEX "twoFactors_userId_idx" ON "two_factors" ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" ("identifier");--> statement-breakpoint
CREATE INDEX "entitlements_product_id_index" ON "entitlements" ("product_id");--> statement-breakpoint
CREATE INDEX "artifacts_release_id_index" ON "artifacts" ("release_id");--> statement-breakpoint
CREATE INDEX "releases_product_id_status_index" ON "releases" ("product_id","status");--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "two_factors" ADD CONSTRAINT "two_factors_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hardware_revisions" ADD CONSTRAINT "hardware_revisions_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entitlement_revisions" ADD CONSTRAINT "entitlement_revisions_entitlement_id_entitlements_id_fkey" FOREIGN KEY ("entitlement_id") REFERENCES "entitlements"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entitlement_revisions" ADD CONSTRAINT "entitlement_revisions_revision_id_hardware_revisions_id_fkey" FOREIGN KEY ("revision_id") REFERENCES "hardware_revisions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_client_account_id_organizations_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "artifacts" ADD CONSTRAINT "artifacts_release_id_releases_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_min_revision_id_hardware_revisions_id_fkey" FOREIGN KEY ("min_revision_id") REFERENCES "hardware_revisions"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "releases" ADD CONSTRAINT "releases_max_revision_id_hardware_revisions_id_fkey" FOREIGN KEY ("max_revision_id") REFERENCES "hardware_revisions"("id") ON DELETE SET NULL;