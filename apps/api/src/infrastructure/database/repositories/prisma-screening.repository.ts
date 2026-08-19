import type {
  CompleteScreeningPersistenceData,
  CompletedScreeningListRecord,
  ListCompletedScreeningsFilter,
  ListCompletedScreeningsParams,
  SaveScreeningMeasurementsData,
  ScreeningExportRecord,
  ScreeningMeasurementsRecord,
  ScreeningRepository,
} from '../../../domain/repositories/screening.repository';
import { prisma } from '../prisma.client';
import { Prisma } from '@prisma/client';

function buildCompletedWhere(filter: ListCompletedScreeningsFilter) {
  const completedAtFilter: { not: null; gte?: Date; lte?: Date } = { not: null };
  if (filter.from) completedAtFilter.gte = filter.from;
  if (filter.to) completedAtFilter.lte = filter.to;

  if (filter.campaignDay != null && filter.campaignStartDate) {
    const dayStart = new Date(filter.campaignStartDate);
    dayStart.setHours(0, 0, 0, 0);
    dayStart.setDate(dayStart.getDate() + filter.campaignDay - 1);

    const dayEnd = new Date(dayStart);
    dayEnd.setHours(23, 59, 59, 999);

    completedAtFilter.gte = completedAtFilter.gte
      ? new Date(Math.max(completedAtFilter.gte.getTime(), dayStart.getTime()))
      : dayStart;
    completedAtFilter.lte = completedAtFilter.lte
      ? new Date(Math.min(completedAtFilter.lte.getTime(), dayEnd.getTime()))
      : dayEnd;
  }

  return {
    campaignId: filter.campaignId,
    status: 'completed',
    completedAt: completedAtFilter,
    ...(filter.patientId ? { patientId: filter.patientId } : {}),
    ...(filter.search
      ? {
          patient: {
            OR: [
              { firstName: { contains: filter.search, mode: 'insensitive' as const } },
              { lastName: { contains: filter.search, mode: 'insensitive' as const } },
              { phone: { contains: filter.search.replace(/\s/g, '') } },
            ],
          },
        }
      : {}),
  };
}

function mapExportRow(row: {
  id: string;
  completedAt: Date | null;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulse: number | null;
  oxygenSaturation: number | null;
  bloodGlucose: number | null;
  bmi: ScreeningMeasurementsRecord['bmi'];
  waistCircumferenceCm: number | null;
  pdfFilename: string | null;
  pdfStoragePath: string | null;
  signatureImageBase64: string | null;
  signatureMimeType: string | null;
  signatureSignedAt: Date | null;
  clinicalEvaluation: unknown;
  patient: {
    firstName: string;
    lastName: string;
    phone: string;
    age: number;
    gender: string;
    city: string;
  } | null;
  operator: {
    firstName: string;
    lastName: string;
  };
}): ScreeningExportRecord {
  return {
    id: row.id,
    completedAt: row.completedAt!,
    patientFirstName: row.patient?.firstName ?? null,
    patientLastName: row.patient?.lastName ?? null,
    patientPhone: row.patient?.phone ?? null,
    patientAge: row.patient?.age ?? null,
    patientGender: row.patient?.gender ?? null,
    patientCity: row.patient?.city ?? null,
    operatorFirstName: row.operator.firstName,
    operatorLastName: row.operator.lastName,
    systolicBp: row.systolicBp,
    diastolicBp: row.diastolicBp,
    pulse: row.pulse,
    oxygenSaturation: row.oxygenSaturation,
    bloodGlucose: row.bloodGlucose,
    bmi: row.bmi !== null ? Number(row.bmi) : null,
    waistCircumferenceCm: row.waistCircumferenceCm,
    hasCriticalWarning: hasCriticalWarnings(row.clinicalEvaluation),
    hasPdf: Boolean(row.pdfStoragePath && row.pdfFilename),
    hasSignature: Boolean(row.signatureImageBase64),
    signatureSignedAt: row.signatureSignedAt,
    signatureImageBase64: row.signatureImageBase64,
    signatureMimeType: row.signatureMimeType,
    pdfFilename: row.pdfFilename,
  };
}

function hasCriticalWarnings(clinicalEvaluation: unknown): boolean {
  if (!clinicalEvaluation || typeof clinicalEvaluation !== 'object') return false;
  const warnings = (clinicalEvaluation as { warnings?: unknown }).warnings;
  if (!Array.isArray(warnings)) return false;
  return warnings.some(
    (warning) =>
      typeof warning === 'object' &&
      warning !== null &&
      (warning as { severity?: unknown }).severity === 'critical',
  );
}

function mapCompletedListRow(row: {
  id: string;
  patientId: string | null;
  completedAt: Date | null;
  pdfFilename: string | null;
  pdfStoragePath: string | null;
  clinicalEvaluation: unknown;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  } | null;
  operator: {
    id: string;
    firstName: string;
    lastName: string;
  };
}): CompletedScreeningListRecord {
  return {
    id: row.id,
    patientId: row.patient?.id ?? row.patientId,
    patientFirstName: row.patient?.firstName ?? null,
    patientLastName: row.patient?.lastName ?? null,
    patientPhone: row.patient?.phone ?? null,
    operatorId: row.operator.id,
    operatorFirstName: row.operator.firstName,
    operatorLastName: row.operator.lastName,
    completedAt: row.completedAt!,
    pdfFilename: row.pdfFilename,
    pdfStoragePath: row.pdfStoragePath,
    clinicalEvaluation: row.clinicalEvaluation,
  };
}

function mapRecord(row: {
  id: string;
  campaignId: string;
  operatorId: string;
  patientId: string | null;
  status: string;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulse: number | null;
  oxygenSaturation: number | null;
  bloodGlucose: number | null;
  bloodGlucoseStatus: string | null;
  weightKg: ScreeningMeasurementsRecord['weightKg'];
  heightCm: ScreeningMeasurementsRecord['heightCm'];
  bmi: ScreeningMeasurementsRecord['bmi'];
  waistCircumferenceCm: number | null;
  knownHypertension: boolean | null;
  knownDiabetes: boolean | null;
  currentAntihypertensiveTreatment: boolean | null;
  completedAt: Date | null;
  pdfFilename: string | null;
  pdfStoragePath: string | null;
  pdfByteLength: number | null;
  pdfGeneratorVersion: number | null;
  pdfGeneratedAt: Date | null;
  participantReport: unknown;
  createdAt: Date;
}): ScreeningMeasurementsRecord {
  return {
    id: row.id,
    campaignId: row.campaignId,
    operatorId: row.operatorId,
    patientId: row.patientId,
    status: row.status,
    systolicBp: row.systolicBp,
    diastolicBp: row.diastolicBp,
    pulse: row.pulse,
    oxygenSaturation: row.oxygenSaturation,
    bloodGlucose: row.bloodGlucose,
    bloodGlucoseStatus: row.bloodGlucoseStatus,
    weightKg: row.weightKg,
    heightCm: row.heightCm,
    bmi: row.bmi,
    waistCircumferenceCm: row.waistCircumferenceCm,
    knownHypertension: row.knownHypertension,
    knownDiabetes: row.knownDiabetes,
    currentAntihypertensiveTreatment: row.currentAntihypertensiveTreatment,
    completedAt: row.completedAt,
    pdfFilename: row.pdfFilename,
    pdfStoragePath: row.pdfStoragePath,
    pdfByteLength: row.pdfByteLength,
    pdfGeneratorVersion: row.pdfGeneratorVersion,
    pdfGeneratedAt: row.pdfGeneratedAt,
    participantReport: row.participantReport,
    createdAt: row.createdAt,
  };
}

export class PrismaScreeningRepository implements ScreeningRepository {
  async findLastMeasurementsByPatientId(patientId: string): Promise<ScreeningMeasurementsRecord | null> {
    const screening = await prisma.screening.findFirst({
      where: {
        patientId,
        systolicBp: { not: null },
      },
      orderBy: { createdAt: 'desc' },
    });

    return screening ? mapRecord(screening) : null;
  }

  async findById(id: string): Promise<ScreeningMeasurementsRecord | null> {
    const screening = await prisma.screening.findUnique({ where: { id } });
    return screening ? mapRecord(screening) : null;
  }

  async createWithMeasurements(data: SaveScreeningMeasurementsData): Promise<ScreeningMeasurementsRecord> {
    const { measurements } = data;
    const screening = await prisma.screening.create({
      data: {
        campaignId: data.campaignId,
        operatorId: data.operatorId,
        patientId: data.patientId,
        status: 'measurements',
        systolicBp: measurements.systolic_bp,
        diastolicBp: measurements.diastolic_bp,
        pulse: measurements.pulse,
        oxygenSaturation: measurements.oxygen_saturation,
        bloodGlucose: measurements.blood_glucose,
        bloodGlucoseStatus: measurements.blood_glucose_status || null,
        weightKg: measurements.weight_kg,
        heightCm: measurements.height_cm,
        bmi: measurements.bmi,
        waistCircumferenceCm: measurements.waist_circumference_cm,
        knownHypertension: measurements.known_hypertension,
        knownDiabetes: measurements.known_diabetes,
        currentAntihypertensiveTreatment: measurements.current_antihypertensive_treatment,
        ...(data.anamnesis
          ? { anamnesis: data.anamnesis as unknown as Prisma.InputJsonValue }
          : {}),
      },
    });

    return mapRecord(screening);
  }

  async completeScreening(data: CompleteScreeningPersistenceData): Promise<ScreeningMeasurementsRecord> {
    const { payload } = data;
    const screening = await prisma.screening.update({
      where: { id: data.screeningId },
      data: {
        status: 'completed',
        completedAt: data.completedAt,
        anamnesis: payload.anamnesis as unknown as Prisma.InputJsonValue,
        clinicalEvaluation: payload.clinical_evaluation as unknown as Prisma.InputJsonValue,
        participantReport: payload.participant_report as unknown as Prisma.InputJsonValue,
        signatureImageBase64: payload.signature.image_base64,
        signatureMimeType: payload.signature.mime_type,
        signatureSignedAt: new Date(payload.signature.signed_at),
        signatureParticipantName: payload.signature.participant_name,
        pdfFilename: payload.pdf.filename,
        pdfStoragePath: data.pdfStoragePath,
        pdfByteLength: payload.pdf.byte_length,
        pdfGeneratorVersion: payload.pdf.generator_version,
        pdfGeneratedAt: new Date(payload.pdf.generated_at),
      },
    });

    return mapRecord(screening);
  }

  async listCompleted(params: ListCompletedScreeningsParams): Promise<{
    items: CompletedScreeningListRecord[];
    total: number;
  }> {
    const where = buildCompletedWhere(params);

    const [rows, total] = await Promise.all([
      prisma.screening.findMany({
        where,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          operator: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { completedAt: 'desc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.screening.count({ where }),
    ]);

    return {
      items: rows.map(mapCompletedListRow),
      total,
    };
  }

  async listCritical(params: ListCompletedScreeningsParams): Promise<{
    items: CompletedScreeningListRecord[];
    total: number;
  }> {
    const rows = await prisma.screening.findMany({
      where: {
        campaignId: params.campaignId,
        status: 'completed',
        clinicalEvaluation: { not: Prisma.DbNull },
        ...(params.patientId ? { patientId: params.patientId } : {}),
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        operator: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    const criticalRows = rows.filter((row) => hasCriticalWarnings(row.clinicalEvaluation));
    const total = criticalRows.length;
    const pageItems = criticalRows.slice(params.skip, params.skip + params.take);

    return {
      items: pageItems.map(mapCompletedListRow),
      total,
    };
  }

  async countCompleted(filter: ListCompletedScreeningsFilter): Promise<number> {
    return prisma.screening.count({ where: buildCompletedWhere(filter) });
  }

  async listCompletedForExport(filter: ListCompletedScreeningsFilter): Promise<ScreeningExportRecord[]> {
    const rows = await prisma.screening.findMany({
      where: buildCompletedWhere(filter),
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            age: true,
            gender: true,
            city: true,
          },
        },
        operator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    });

    return rows.map(mapExportRow);
  }
}
