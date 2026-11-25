ALTER TABLE "game_sessions" ADD COLUMN "ranking_eligible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "game_sessions" ALTER COLUMN "ranking_eligible" SET DEFAULT true;--> statement-breakpoint
CREATE INDEX "game_sessions_ranking_idx" ON "game_sessions" USING btree ("status","ranking_eligible","finished_at");
