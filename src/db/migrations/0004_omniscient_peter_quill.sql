CREATE TABLE "competitions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"venue_id" uuid NOT NULL,
	"local_date" date NOT NULL,
	"name" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"registration_opens_at" timestamp with time zone NOT NULL,
	"join_cutoff_at" timestamp with time zone NOT NULL,
	"finalization_grace_until" timestamp with time zone NOT NULL,
	"status" text DEFAULT 'scheduled' NOT NULL,
	"is_test" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_blueprint_slots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"position" integer NOT NULL,
	"difficulty" text NOT NULL,
	"category_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_blueprint_slots_round_range" CHECK ("round_number" BETWEEN 1 AND 3),
	CONSTRAINT "competition_blueprint_slots_position_range" CHECK ("position" BETWEEN 1 AND 10)
);
--> statement-breakpoint
CREATE TABLE "competition_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_id" uuid NOT NULL,
	"table_id" uuid NOT NULL,
	"table_session_id" uuid NOT NULL,
	"group_id" uuid NOT NULL,
	"status" text DEFAULT 'registered' NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "competition_rounds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"competition_entry_id" uuid NOT NULL,
	"round_number" integer NOT NULL,
	"game_session_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "competition_rounds_game_session_id_unique" UNIQUE("game_session_id"),
	CONSTRAINT "competition_rounds_round_range" CHECK ("round_number" BETWEEN 1 AND 3)
);
--> statement-breakpoint
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_blueprint_slots" ADD CONSTRAINT "competition_blueprint_slots_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_blueprint_slots" ADD CONSTRAINT "competition_blueprint_slots_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_competition_id_competitions_id_fk" FOREIGN KEY ("competition_id") REFERENCES "public"."competitions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_table_id_tables_id_fk" FOREIGN KEY ("table_id") REFERENCES "public"."tables"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_table_session_id_table_sessions_id_fk" FOREIGN KEY ("table_session_id") REFERENCES "public"."table_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_entries" ADD CONSTRAINT "competition_entries_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_rounds" ADD CONSTRAINT "competition_rounds_competition_entry_id_competition_entries_id_fk" FOREIGN KEY ("competition_entry_id") REFERENCES "public"."competition_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "competition_rounds" ADD CONSTRAINT "competition_rounds_game_session_id_game_sessions_id_fk" FOREIGN KEY ("game_session_id") REFERENCES "public"."game_sessions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "competitions_venue_date_status_idx" ON "competitions" USING btree ("venue_id","local_date","status");--> statement-breakpoint
CREATE INDEX "competitions_status_idx" ON "competitions" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_blueprint_slots_comp_round_pos_idx" ON "competition_blueprint_slots" USING btree ("competition_id","round_number","position");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_entries_competition_table_unique" ON "competition_entries" USING btree ("competition_id","table_id");--> statement-breakpoint
CREATE INDEX "competition_entries_competition_status_idx" ON "competition_entries" USING btree ("competition_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "competition_rounds_entry_round_unique" ON "competition_rounds" USING btree ("competition_entry_id","round_number");