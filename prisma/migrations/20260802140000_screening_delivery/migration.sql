-- CreateTable
CREATE TABLE "screening_deliveries" (
    "id" UUID NOT NULL,
    "screening_id" UUID NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "provider_message_id" TEXT,
    "error_message" TEXT,
    "attempted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMP(3),
    "operator_id" UUID NOT NULL,

    CONSTRAINT "screening_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "screening_deliveries_screening_id_idx" ON "screening_deliveries"("screening_id");

-- CreateIndex
CREATE INDEX "screening_deliveries_screening_id_channel_idx" ON "screening_deliveries"("screening_id", "channel");

-- AddForeignKey
ALTER TABLE "screening_deliveries" ADD CONSTRAINT "screening_deliveries_screening_id_fkey" FOREIGN KEY ("screening_id") REFERENCES "screenings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_deliveries" ADD CONSTRAINT "screening_deliveries_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
