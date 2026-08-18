import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { seedClinicalRules } from './seed-clinical-rules';
import { seedClinicSettings } from './seed-clinic-settings';

const prisma = new PrismaClient();

const ROLES = ['ADMIN', 'OPERATOR', 'MEDIC'] as const;

async function main() {
  const isProduction = process.env.NODE_ENV === 'production';
  const includeDemoData = process.env.SEED_DEMO_DATA === 'true' || !isProduction;

  for (const name of ROLES) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  const adminRole = await prisma.role.findUnique({ where: { name: 'ADMIN' } });
  if (!adminRole) {
    throw new Error('ADMIN role not found after seed');
  }

  const passwordHash = await bcrypt.hash('Admin123!', 12);

  await prisma.user.upsert({
    where: { email: 'admin@medscreen.ro' },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'MedScreen',
      email: 'admin@medscreen.ro',
      passwordHash,
      roleId: adminRole.id,
      active: true,
    },
  });

  console.log('[seed] Roles and default admin user created.');
  if (isProduction) {
    console.warn('[seed] Production seed: change the default admin password immediately after first login.');
  } else {
    console.log('[seed] Admin login: admin@medscreen.ro / Admin123!');
  }

  const pilotStart = new Date('2026-07-31');
  const pilotEnd = new Date('2026-08-03');

  await prisma.campaign.upsert({
    where: { id: '11111111-1111-4111-8111-111111111111' },
    update: {
      isActive: true,
      status: 'active',
    },
    create: {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Festivalul Tradiții Argeșene',
      workPoint: 'Stand Principal - Zona Centrală',
      edition: 'Ediția XIII',
      description: 'Screening cardiovascular și metabolic — eveniment pilot MedScreen.',
      startDate: pilotStart,
      endDate: pilotEnd,
      isActive: true,
      status: 'active',
      organizer: 'MedScreen Festival',
      screeningType: 'Cardiovascular și metabolic',
      notes: null,
    },
  });

  await prisma.campaign.upsert({
    where: { id: '22222222-2222-4222-8222-222222222222' },
    update: {
      isActive: false,
      status: 'closed',
    },
    create: {
      id: '22222222-2222-4222-8222-222222222222',
      name: 'Campania Anuală de Prevenție Pitești',
      workPoint: 'Stația Mobilă Caravana',
      edition: '2026',
      description: 'Campanie de prevenție — inactivă pentru sezonul curent.',
      startDate: new Date('2026-06-01'),
      endDate: new Date('2026-06-30'),
      isActive: false,
      status: 'closed',
      organizer: 'MedScreen Festival',
      screeningType: 'Prevenție generală',
      notes: null,
    },
  });

  console.log('[seed] Campaigns created.');

  if (!includeDemoData) {
    console.log('[seed] Demo patient/screening skipped (set SEED_DEMO_DATA=true to include).');
    await seedClinicalRules(prisma);
    await seedClinicSettings(prisma);
    return;
  }

  const samplePatient = await prisma.patient.upsert({
    where: { phone: '0722123456' },
    update: {},
    create: {
      id: '33333333-3333-4333-8333-333333333333',
      firstName: 'Ion',
      lastName: 'Popescu',
      phone: '0722123456',
      age: 45,
      gender: 'M',
      city: 'Pitești',
    },
  });

  const adminUser = await prisma.user.findUnique({ where: { email: 'admin@medscreen.ro' } });
  const pilotCampaign = await prisma.campaign.findUnique({
    where: { id: '11111111-1111-4111-8111-111111111111' },
  });

  if (adminUser && pilotCampaign) {
    await prisma.screening.upsert({
      where: { id: '44444444-4444-4444-8444-444444444444' },
      update: {
        patientId: samplePatient.id,
        systolicBp: 165,
        diastolicBp: 95,
        pulse: 78,
        oxygenSaturation: 97,
        bloodGlucose: 112,
        bloodGlucoseStatus: 'fasting',
        weightKg: 82,
        heightCm: 175,
        bmi: 26.78,
        waistCircumferenceCm: 98,
        knownHypertension: true,
        knownDiabetes: false,
        currentAntihypertensiveTreatment: true,
      },
      create: {
        id: '44444444-4444-4444-8444-444444444444',
        campaignId: pilotCampaign.id,
        operatorId: adminUser.id,
        patientId: samplePatient.id,
        status: 'completed',
        systolicBp: 165,
        diastolicBp: 95,
        pulse: 78,
        oxygenSaturation: 97,
        bloodGlucose: 112,
        bloodGlucoseStatus: 'fasting',
        weightKg: 82,
        heightCm: 175,
        bmi: 26.78,
        waistCircumferenceCm: 98,
        knownHypertension: true,
        knownDiabetes: false,
        currentAntihypertensiveTreatment: true,
        createdAt: new Date('2026-07-30T14:30:00.000Z'),
      },
    });
  }

  console.log('[seed] Sample patient created: Ion Popescu — 0722123456');

  await seedClinicalRules(prisma);
  await seedClinicSettings(prisma);
}

main()
  .catch((error) => {
    console.error('[seed] Failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
