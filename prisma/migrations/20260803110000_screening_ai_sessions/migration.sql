-- CreateTable
CREATE TABLE "screening_ai_sessions" (
    "id" UUID NOT NULL,
    "operator_id" UUID NOT NULL,
    "campaign_id" UUID,
    "screening_id" UUID,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "transcript" JSONB NOT NULL DEFAULT '[]',
    "extraction" JSONB,
    "operator_review" JSONB NOT NULL DEFAULT '[]',
    "provider_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "screening_ai_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "screening_ai_sessions_screening_id_key" ON "screening_ai_sessions"("screening_id");

-- CreateIndex
CREATE INDEX "screening_ai_sessions_operator_id_idx" ON "screening_ai_sessions"("operator_id");

-- CreateIndex
CREATE INDEX "screening_ai_sessions_campaign_id_idx" ON "screening_ai_sessions"("campaign_id");

-- AddForeignKey
ALTER TABLE "screening_ai_sessions" ADD CONSTRAINT "screening_ai_sessions_operator_id_fkey" FOREIGN KEY ("operator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_ai_sessions" ADD CONSTRAINT "screening_ai_sessions_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "screening_ai_sessions" ADD CONSTRAINT "screening_ai_sessions_screening_id_fkey" FOREIGN KEY ("screening_id") REFERENCES "screenings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
