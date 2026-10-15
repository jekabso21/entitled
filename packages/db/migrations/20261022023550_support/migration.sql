CREATE TABLE "support_attachments" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"message_id" uuid,
	"uploaded_by_user_id" uuid NOT NULL,
	"file_name" text NOT NULL,
	"content_type" text NOT NULL,
	"size_bytes" bigint NOT NULL,
	"storage_key" text NOT NULL UNIQUE,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"thread_id" uuid NOT NULL,
	"author_user_id" uuid,
	"body" text NOT NULL,
	"internal" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_threads" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7(),
	"client_account_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"release_id" uuid,
	"subject" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"created_by_user_id" uuid,
	"last_message_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "support_attachments_message_id_index" ON "support_attachments" ("message_id");--> statement-breakpoint
CREATE INDEX "support_messages_thread_id_created_at_index" ON "support_messages" ("thread_id","created_at");--> statement-breakpoint
CREATE INDEX "support_threads_client_account_id_last_message_at_index" ON "support_threads" ("client_account_id","last_message_at");--> statement-breakpoint
CREATE INDEX "support_threads_status_last_message_at_index" ON "support_threads" ("status","last_message_at");--> statement-breakpoint
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_message_id_support_messages_id_fkey" FOREIGN KEY ("message_id") REFERENCES "support_messages"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_attachments" ADD CONSTRAINT "support_attachments_uploaded_by_user_id_users_id_fkey" FOREIGN KEY ("uploaded_by_user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_thread_id_support_threads_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "support_threads"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_author_user_id_users_id_fkey" FOREIGN KEY ("author_user_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_client_account_id_organizations_id_fkey" FOREIGN KEY ("client_account_id") REFERENCES "organizations"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_product_id_products_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_release_id_releases_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "support_threads" ADD CONSTRAINT "support_threads_created_by_user_id_users_id_fkey" FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL;