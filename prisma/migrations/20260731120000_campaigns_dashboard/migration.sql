-- CreateTable
CREATE TABLE "campaigns" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "work_point" TEXT NOT NULL,
    "edition" TEXT,
    "description" TEXT,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "screenings" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "screenings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "screenings_campaign_id_idx" ON "screenings"("campaign_id");

-- CreateIndex
CREATE INDEX "screenings_operator_id_idx" ON "screenings"("operator_id");

-- CreateIndex
CREATE INDEX "screenings_created_at_idx" ON "screenings"("created_at");

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screenings" ADD CONSTRAINT "screenings_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
