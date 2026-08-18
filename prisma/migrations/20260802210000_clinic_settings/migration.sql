-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "clinic_info" JSONB NOT NULL,
    "branding" JSONB NOT NULL,
    "contact" JSONB NOT NULL,
    "logo" JSONB NOT NULL,
    "footer" JSONB NOT NULL,
    "pdf" JSONB NOT NULL,
    "qr" JSONB NOT NULL,
    "smtp" JSONB NOT NULL,
    "whatsapp" JSONB NOT NULL,
    "ai" JSONB NOT NULL,
    "application_settings" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "updated_by_id" UUID,
    "updated_by_name" TEXT,

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);
