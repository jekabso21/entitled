CREATE TABLE "release_client_accounts" (
	"release_id" uuid,
	"client_account_id" uuid,
	CONSTRAINT "release_client_accounts_pkey" PRIMARY KEY("release_id","client_account_id")
);
--> statement-breakpoint
ALTER TABLE "releases" ADD COLUMN "audience" text DEFAULT 'entitled' NOT NULL;--> statement-breakpoint
CREATE INDEX "release_client_accounts_client_account_id_index" ON "release_client_accounts" ("client_account_id");--> statement-breakpoint
ALTER TABLE "release_client_accounts" ADD CONSTRAINT "release_client_accounts_release_id_releases_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "release_client_accounts" ADD CONSTRAINT "release_client_accounts_client_account_id_organizations_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "organizations"("id") ON DELETE CASCADE;