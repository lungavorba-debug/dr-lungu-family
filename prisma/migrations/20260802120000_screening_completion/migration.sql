-- AlterTable
ALTER TABLE "screenings" ALTER COLUMN "status" SET DEFAULT 'measurements';

ALTER TABLE "screenings" ADD COLUMN "anamnesis" JSONB;
ALTER TABLE "screenings" ADD COLUMN "clinical_evaluation" JSONB;
ALTER TABLE "screenings" ADD COLUMN "participant_report" JSONB;
ALTER TABLE "screenings" ADD COLUMN "signature_image_base64" TEXT;
ALTER TABLE "screenings" ADD COLUMN "signature_mime_type" TEXT;
ALTER TABLE "screenings" ADD COLUMN "signature_signed_at" TIMESTAMP(3);
ALTER TABLE "screenings" ADD COLUMN "signature_participant_name" TEXT;
ALTER TABLE "screenings" ADD COLUMN "pdf_filename" TEXT;
ALTER TABLE "screenings" ADD COLUMN "pdf_storage_path" TEXT;
ALTER TABLE "screenings" ADD COLUMN "pdf_byte_length" INTEGER;
ALTER TABLE "screenings" ADD COLUMN "pdf_generator_version" INTEGER;
ALTER TABLE "screenings" ADD COLUMN "pdf_generated_at" TIMESTAMP(3);
ALTER TABLE "screenings" ADD COLUMN "completed_at" TIMESTAMP(3);

CREATE INDEX "screenings_status_idx" ON "screenings"("status");
