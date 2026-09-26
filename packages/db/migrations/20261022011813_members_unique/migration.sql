-- Better Auth's generated schema has no uniqueness on membership; one row per user and account is assumed everywhere.
DELETE FROM "members" a USING "members" b
WHERE a.organization_id = b.organization_id AND a.user_id = b.user_id AND a.id > b.id;
--> statement-breakpoint
CREATE UNIQUE INDEX "members_organization_id_user_id_uidx" ON "members" ("organization_id", "user_id");
