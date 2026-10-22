CREATE TABLE "doc_page_revisions" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"page_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "doc_pages" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
CREATE INDEX "doc_page_revisions_page_id_created_at_index" ON "doc_page_revisions" ("page_id","created_at");--> statement-breakpoint
CREATE INDEX "doc_pages_search_idx" ON "doc_pages" USING gin ((setweight(to_tsvector('simple', "title"), 'A') || setweight(to_tsvector('simple', "body"), 'B')));--> statement-breakpoint
ALTER TABLE "doc_page_revisions" ADD CONSTRAINT "doc_page_revisions_page_id_doc_pages_id_fkey" FOREIGN KEY ("page_id") REFERENCES "doc_pages"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "doc_page_revisions" ADD CONSTRAINT "doc_page_revisions_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
-- Existing pages start their history with their current state.
INSERT INTO "doc_page_revisions" ("page_id", "title", "body", "created_by_user_id", "created_at")
SELECT "id", "title", "body", "updated_by_user_id", "updated_at" FROM "doc_pages";
