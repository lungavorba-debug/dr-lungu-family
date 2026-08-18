-- CreateTable
CREATE TABLE "clinical_rule_sets" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_rule_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_rules" (
    "id" UUID NOT NULL,
    "rule_set_id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "threshold_key" TEXT,
    "threshold_value" DECIMAL(10,2),
    "threshold_unit" TEXT,
    "recommendation_text" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinical_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinical_rule_changes" (
    "id" UUID NOT NULL,
    "rule_id" UUID NOT NULL,
    "rule_set_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "changed_by_id" UUID NOT NULL,
    "changed_by_name" TEXT NOT NULL,
    "change_type" TEXT NOT NULL,
    "previous_value" JSONB,
    "new_value" JSONB NOT NULL,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clinical_rule_changes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "clinical_rules_rule_set_id_enabled_idx" ON "clinical_rules"("rule_set_id", "enabled");

-- CreateIndex
CREATE INDEX "clinical_rules_category_idx" ON "clinical_rules"("category");

-- CreateIndex
CREATE UNIQUE INDEX "clinical_rules_rule_set_id_code_key" ON "clinical_rules"("rule_set_id", "code");

-- CreateIndex
CREATE INDEX "clinical_rule_changes_rule_id_idx" ON "clinical_rule_changes"("rule_id");

-- CreateIndex
CREATE INDEX "clinical_rule_changes_rule_set_id_idx" ON "clinical_rule_changes"("rule_set_id");

-- CreateIndex
CREATE INDEX "clinical_rule_changes_occurred_at_idx" ON "clinical_rule_changes"("occurred_at");

-- AddForeignKey
ALTER TABLE "clinical_rules" ADD CONSTRAINT "clinical_rules_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "clinical_rule_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_rule_changes" ADD CONSTRAINT "clinical_rule_changes_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "clinical_rules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clinical_rule_changes" ADD CONSTRAINT "clinical_rule_changes_rule_set_id_fkey" FOREIGN KEY ("rule_set_id") REFERENCES "clinical_rule_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
