-- Campaign management lifecycle fields
ALTER TABLE "campaigns" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'upcoming';
ALTER TABLE "campaigns" ADD COLUMN "organizer" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "screening_type" TEXT;
ALTER TABLE "campaigns" ADD COLUMN "notes" TEXT;

UPDATE "campaigns"
SET "status" = CASE WHEN "is_active" = true THEN 'active' ELSE 'closed' END;

CREATE INDEX "campaigns_status_idx" ON "campaigns"("status");

ALTER TABLE "campaigns" ALTER COLUMN "is_active" SET DEFAULT false;
