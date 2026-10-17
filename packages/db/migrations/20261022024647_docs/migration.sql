CREATE TABLE "doc_assets" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"product_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"storage_key" text NOT NULL UNIQUE,
	"uploaded_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "doc_pages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"product_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"updated_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "doc_pages_product_id_slug_unique" UNIQUE("product_id","slug")
);
--> statement-breakpoint
CREATE INDEX "doc_assets_product_id_index" ON "doc_assets" ("product_id");--> statement-breakpoint
CREATE INDEX "doc_pages_product_id_position_index" ON "doc_pages" ("product_id","position");--> statement-breakpoint
ALTER TABLE "doc_assets" ADD CONSTRAINT "doc_assets_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "doc_assets" ADD CONSTRAINT "doc_assets_uploaded_by_user_id_users_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "doc_pages" ADD CONSTRAINT "doc_pages_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "doc_pages" ADD CONSTRAINT "doc_pages_updated_by_user_id_users_id_fkey" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;