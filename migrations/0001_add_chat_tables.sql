
-- Add wey_id column to users table
ALTER TABLE "users" ADD COLUMN "wey_id" varchar(8) NOT NULL DEFAULT '';

-- Create index for wey_id
CREATE UNIQUE INDEX IF NOT EXISTS "users_wey_id_unique" ON "users" ("wey_id");

-- Create contacts table
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"contact_wey_id" varchar NOT NULL,
	"contact_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS "messages" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" varchar NOT NULL,
	"to_wey_id" varchar NOT NULL,
	"content" text NOT NULL,
	"message_type" varchar DEFAULT 'text' NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign keys
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_contact_wey_id_users_wey_id_fk" FOREIGN KEY ("contact_wey_id") REFERENCES "users"("wey_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_to_wey_id_users_wey_id_fk" FOREIGN KEY ("to_wey_id") REFERENCES "users"("wey_id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Update existing users with random Wey IDs
UPDATE "users" SET "wey_id" = (
    SELECT string_agg(substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', ceil(random()*36)::integer, 1), '')
    FROM generate_series(1, 8)
) WHERE "wey_id" = '';
