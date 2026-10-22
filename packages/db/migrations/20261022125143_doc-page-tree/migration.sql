ALTER TABLE "doc_pages" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
CREATE INDEX "doc_pages_parent_id_index" ON "doc_pages" ("parent_id");--> statement-breakpoint
ALTER TABLE "doc_pages" ADD CONSTRAINT "doc_pages_parent_id_doc_pages_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "doc_pages"("id") ON DELETE CASCADE;