CREATE TABLE IF NOT EXISTS "UserProfile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"name" varchar(128) NOT NULL,
	"education" text,
	"pastExperience" text,
	"learningGoals" text,
	"dailyTimeCommitment" varchar(64),
	"priorKnowledge" varchar(64),
	"currentGoal" text,
	"avatarFallback" varchar(10),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
