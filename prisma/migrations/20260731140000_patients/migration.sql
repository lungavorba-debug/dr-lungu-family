-- CreateTable
CREATE TABLE "patients" (
    "id" UUID NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "patients_phone_key" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- AlterTable
ALTER TABLE "screenings" ADD COLUMN "patient_id" UUID;

-- CreateIndex
CREATE INDEX "screenings_patient_id_idx" ON "screenings"("patient_id");

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
