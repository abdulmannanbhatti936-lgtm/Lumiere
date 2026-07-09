CREATE TYPE "public"."hotel_category" AS ENUM('beach', 'city', 'mountain', 'boutique');--> statement-breakpoint
ALTER TABLE "hotels" ADD COLUMN "category" "hotel_category" DEFAULT 'city' NOT NULL;