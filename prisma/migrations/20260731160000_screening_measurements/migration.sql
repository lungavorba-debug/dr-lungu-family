-- AlterTable
ALTER TABLE "screenings" ADD COLUMN "systolic_bp" INTEGER;
ALTER TABLE "screenings" ADD COLUMN "diastolic_bp" INTEGER;
ALTER TABLE "screenings" ADD COLUMN "pulse" INTEGER;
ALTER TABLE "screenings" ADD COLUMN "oxygen_saturation" INTEGER;
ALTER TABLE "screenings" ADD COLUMN "blood_glucose" INTEGER;
ALTER TABLE "screenings" ADD COLUMN "blood_glucose_status" TEXT;
ALTER TABLE "screenings" ADD COLUMN "weight_kg" DECIMAL(5,2);
ALTER TABLE "screenings" ADD COLUMN "height_cm" DECIMAL(5,2);
ALTER TABLE "screenings" ADD COLUMN "bmi" DECIMAL(4,2);
ALTER TABLE "screenings" ADD COLUMN "waist_circumference_cm" INTEGER;
ALTER TABLE "screenings" ADD COLUMN "known_hypertension" BOOLEAN;
ALTER TABLE "screenings" ADD COLUMN "known_diabetes" BOOLEAN;
ALTER TABLE "screenings" ADD COLUMN "current_antihypertensive_treatment" BOOLEAN;
