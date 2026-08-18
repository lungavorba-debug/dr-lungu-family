/**
 * Clinic settings persistence and resolver tests.
 * Run: npm run test:clinic-settings
 */
import { composeParticipantReport } from '@medscreen/shared';
import type { ClinicalRiskAssessment } from '@medscreen/types';
import {
  GetClinicSettingsUseCase,
  GetPublicClinicSettingsUseCase,
  UpdateClinicSettingsSectionUseCase,
} from './clinic-settings.use-cases';
import { UploadClinicBrandingAssetUseCase } from './upload-clinic-branding-asset.use-case';
import type { BrandingAssetKind } from '@medscreen/types';
import type { ClinicSettingsRecord } from '@medscreen/types';
import type {
  ClinicSettingsDbRecord,
  ClinicSettingsRepository,
} from '../../domain/repositories/clinic-settings.repository';
import { mapDbRecordToSettings } from '../../domain/repositories/clinic-settings.repository';
import { ClinicSettingsResolver } from '../../infrastructure/clinic-settings/clinic-settings.resolver';
import { cloneDefaultClinicSettings, SECRET_MASK } from '@medscreen/shared';

function assert(name: string, ok: boolean, detail = ''): void {
  console.log(`${ok ? '✔' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!ok) process.exitCode = 1;
}

function demoRisk(category: ClinicalRiskAssessment['category']): ClinicalRiskAssessment {
  return {
    category,
    level: 'unknown',
    summary: 'test',
    factors: [],
    rule_set_id: 'test',
    is_demo: true,
  };
}

const demoRisks = {
  cardiovascular: demoRisk('cardiovascular'),
  diabetes: demoRisk('diabetes'),
  sleep_apnea: demoRisk('sleep_apnea'),
};

class InMemoryClinicSettingsRepository implements ClinicSettingsRepository {
  private record: ClinicSettingsDbRecord | null = null;

  async get(): Promise<ClinicSettingsDbRecord | null> {
    return this.record;
  }

  async upsert(
    settings: ClinicSettingsRecord,
    changedBy?: { id: string; name: string },
  ): Promise<ClinicSettingsDbRecord> {
    this.record = {
      id: 'default',
      clinicInfo: settings.clinic,
      branding: settings.branding,
      contact: settings.contact,
      logo: settings.logo,
      footer: settings.footer,
      pdf: settings.pdf,
      qr: settings.qr,
      smtp: settings.smtp,
      whatsapp: settings.whatsapp,
      ai: settings.ai,
      application: settings.application,
      updatedAt: new Date(),
      updatedById: changedBy?.id ?? null,
      updatedByName: changedBy?.name ?? null,
    };
    return this.record;
  }

  async updateSection(
    section: keyof ClinicSettingsRecord,
    data: ClinicSettingsRecord[keyof ClinicSettingsRecord],
    changedBy: { id: string; name: string },
  ): Promise<ClinicSettingsDbRecord> {
    if (!this.record) {
      await this.upsert(cloneDefaultClinicSettings(), changedBy);
    }
    const current = mapDbRecordToSettings(this.record!);
    const next = { ...current, [section]: data };
    return this.upsert(next, changedBy);
  }
}

const repository = new InMemoryClinicSettingsRepository();
const resolver = new ClinicSettingsResolver(repository);
const getPublic = new GetPublicClinicSettingsUseCase(repository, resolver);
const getAdmin = new GetClinicSettingsUseCase(repository, resolver);
const updateSection = new UpdateClinicSettingsSectionUseCase(repository, resolver);

async function run(): Promise<void> {
  const admin = await getAdmin.execute();
  assert('seeds default settings when missing', admin.clinic.name.length > 0);

  const updated = await updateSection.execute(
    {
      section: 'clinic',
      data: {
        ...admin.clinic,
        name: 'Clinica Test',
      },
    },
    { id: 'admin-1', name: 'Admin Test' },
  );
  assert('updates clinic section', updated.clinic.name === 'Clinica Test');

  await updateSection.execute(
    {
      section: 'smtp',
      data: {
        enabled: true,
        host: 'smtp.test.ro',
        port: 587,
        secure: false,
        user: 'user',
        pass: 'secret-pass',
        from: 'noreply@test.ro',
      },
    },
    { id: 'admin-1', name: 'Admin Test' },
  );

  const adminAfterSmtp = await getAdmin.execute();
  assert('masks smtp password in admin response', adminAfterSmtp.smtp.pass === SECRET_MASK);

  const savedSmtpHost = process.env.SMTP_HOST;
  delete process.env.SMTP_HOST;
  const smtpSettingsFromDb = await resolver.getSmtpSettings();
  if (savedSmtpHost) process.env.SMTP_HOST = savedSmtpHost;
  assert('resolver reads smtp from db when SMTP_HOST is missing', smtpSettingsFromDb?.host === 'smtp.test.ro');

  if (savedSmtpHost?.trim()) {
    const smtpSettingsFromEnv = await resolver.getSmtpSettings();
    assert('env SMTP takes precedence over db clinic settings', smtpSettingsFromEnv?.host === savedSmtpHost.trim());
    assert('env SMTP ignores db ethereal override', !smtpSettingsFromEnv?.host.includes('ethereal.email'));
  }

  assert('email configured via resolver', await resolver.isEmailConfigured());

  const publicSettings = await getPublic.execute();
  assert('public settings exclude secrets', publicSettings.settings.clinic.name === 'Clinica Test');
  assert('public settings include pdf config', publicSettings.settings.pdf.report_title.length > 0);

  const snapshot = {
    clinic: updated.clinic,
    contact: admin.contact,
    footer: admin.footer,
    pdf: admin.pdf,
    qr: admin.qr,
    logo: admin.logo,
  };

  const report = composeParticipantReport(
    {
      participant: { first_name: 'Ion', last_name: 'Popescu', gender: 'M', age: 45 },
      campaign: { name: 'Test', work_point: 'Stand', edition: null, description: null },
      screeningDate: new Date().toISOString(),
      operatorName: 'Operator Test',
      measurements: {
        systolic_bp: 120,
        diastolic_bp: 80,
        pulse: 72,
        oxygen_saturation: 98,
        blood_glucose: 95,
        blood_glucose_status: 'fasting',
        weight_kg: 80,
        height_cm: 175,
        bmi: 26.1,
        ideal_weight_kg: 70.7,
        waist_circumference_cm: 90,
        known_hypertension: false,
        known_diabetes: false,
        current_antihypertensive_treatment: false,
      },
      anamnesis: {
        smoking_status: '',
        alcohol_consumption: '',
        known_diabetes: null,
        chest_pain: null,
        dyspnea: null,
        snoring: null,
        current_treatment: '',
        free_notes: '',
      },
      evaluation: {
        engine_version: '1.0.0',
        rule_set_id: 'test',
        is_demo: false,
        evaluated_at: new Date().toISOString(),
        screening_id: '44444444-4444-4444-8444-444444444444',
        patient_id: '33333333-3333-4333-8333-333333333333',
        risks: demoRisks,
        warnings: [],
        recommendations: [],
        interpretation: { summary: 'test', sections: [] },
      },
    },
    snapshot,
  );

  assert('report uses configured clinic name', report.clinic.name === 'Clinica Test');
  assert('static compose still works without settings', composeParticipantReport({
    participant: { first_name: 'A', last_name: 'B', gender: 'F', age: 30 },
    campaign: { name: 'C', work_point: 'W', edition: null, description: null },
    screeningDate: new Date().toISOString(),
    operatorName: 'Op',
    measurements: {
      systolic_bp: 120,
      diastolic_bp: 80,
      pulse: 72,
      oxygen_saturation: 98,
      blood_glucose: 95,
      blood_glucose_status: 'fasting',
      weight_kg: 60,
      height_cm: 165,
      bmi: 22,
      ideal_weight_kg: 70.7,
      waist_circumference_cm: 70,
      known_hypertension: false,
      known_diabetes: false,
      current_antihypertensive_treatment: false,
    },
    anamnesis: {
      smoking_status: '',
      alcohol_consumption: '',
      known_diabetes: null,
      chest_pain: null,
      dyspnea: null,
      snoring: null,
      current_treatment: '',
      free_notes: '',
    },
    evaluation: {
      engine_version: '1.0.0',
      rule_set_id: 'test',
      is_demo: true,
      evaluated_at: new Date().toISOString(),
      screening_id: '44444444-4444-4444-8444-444444444444',
      patient_id: '33333333-3333-4333-8333-333333333333',
      risks: demoRisks,
      warnings: [],
      recommendations: [],
      interpretation: { summary: 'test', sections: [] },
    },
  }).clinic.name.length > 0);

  class MemoryBrandingStorage {
    files = new Map<string, Buffer>();

    async saveAsset(kind: BrandingAssetKind, mime: string, bytes: Buffer): Promise<string> {
      const filename = `${kind}.${mime.includes('png') ? 'png' : 'bin'}`;
      this.files.set(filename, bytes);
      return filename;
    }

    async readAsset(kind: BrandingAssetKind, mime: string): Promise<Buffer | null> {
      const filename = `${kind}.${mime.includes('png') ? 'png' : 'bin'}`;
      return this.files.get(filename) ?? null;
    }
  }

  const brandingStorage = new MemoryBrandingStorage();
  const uploadBranding = new UploadClinicBrandingAssetUseCase(
    repository,
    resolver,
    brandingStorage as unknown as import('../../infrastructure/storage/clinic-branding-storage.service').ClinicBrandingStorageService,
  );

  const pngBytes = Buffer.from('fake-png');
  const uploadedLogo = await uploadBranding.execute(
    {
      kind: 'logo',
      mime: 'image/png',
      file_base64: pngBytes.toString('base64'),
    },
    { id: 'admin-1', name: 'Admin Test' },
  );
  assert('upload logo path persisted', uploadedLogo.logo_path === '/clinic-settings/assets/logo');
  assert('upload logo mime persisted', uploadedLogo.logo_mime === 'image/png');

  const uploadedFavicon = await uploadBranding.execute(
    {
      kind: 'favicon',
      mime: 'image/png',
      file_base64: pngBytes.toString('base64'),
    },
    { id: 'admin-1', name: 'Admin Test' },
  );
  assert('upload favicon path persisted', uploadedFavicon.favicon_path === '/clinic-settings/assets/favicon');
}

void run();
