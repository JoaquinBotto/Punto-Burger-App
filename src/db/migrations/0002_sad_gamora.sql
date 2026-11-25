ALTER TABLE "game_questions" ADD COLUMN "target_participant_id" uuid;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "prompt_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "option_a_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "option_b_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "option_c_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "option_d_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "correct_option_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "explanation_snapshot" text;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "age_range_snapshot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "game_questions" ADD COLUMN "education_level_snapshot" text;--> statement-breakpoint
ALTER TABLE "game_questions" ADD CONSTRAINT "game_questions_target_participant_id_participants_id_fk" FOREIGN KEY ("target_participant_id") REFERENCES "public"."participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "game_questions_session_question_unique" ON "game_questions" USING btree ("game_session_id","question_id");--> statement-breakpoint
ALTER TABLE "game_questions" ADD CONSTRAINT "game_questions_position_range" CHECK ("position" BETWEEN 1 AND 10);