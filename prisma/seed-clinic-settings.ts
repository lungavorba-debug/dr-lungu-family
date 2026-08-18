import type { PrismaClient } from '@prisma/client';
import { cloneDefaultClinicSettings } from '@medscreen/shared';

export async function seedClinicSettings(prisma: PrismaClient): Promise<void> {
  const defaults = cloneDefaultClinicSettings();

  await prisma.clinicSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      clinicInfo: defaults.clinic,
      branding: defaults.branding,
      contact: defaults.contact,
      logo: defaults.logo,
      footer: defaults.footer,
      pdf: defaults.pdf,
      qr: defaults.qr,
      smtp: defaults.smtp,
      whatsapp: defaults.whatsapp,
      ai: defaults.ai,
      application: defaults.application,
    },
  });

  console.log('[seed] Clinic settings seeded.');
}
