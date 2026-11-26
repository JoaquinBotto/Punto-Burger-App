DROP INDEX "competition_entries_competition_table_unique";--> statement-breakpoint
ALTER TABLE "competitions" ALTER COLUMN "local_date" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ALTER COLUMN "starts_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ALTER COLUMN "ends_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ALTER COLUMN "registration_opens_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ALTER COLUMN "join_cutoff_at" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ALTER COLUMN "finalization_grace_until" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "timing_mode" text DEFAULT 'scheduled' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "competition_entries_competition_table_session_unique" ON "competition_entries" USING btree ("competition_id","table_session_id");