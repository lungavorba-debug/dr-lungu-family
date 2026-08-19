import type {
  BloodGlucoseStatus,
  CompleteScreeningRequest,
  MedicalMeasurements,
  ScreeningAnamnesis,
} from '@medscreen/types';
import { Decimal } from '@prisma/client/runtime/library';

export interface ScreeningMeasurementsRecord {
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
  weightKg: Decimal | null;
  heightCm: Decimal | null;
  bmi: Decimal | null;
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
  participantReport: unknown | null;
  createdAt: Date;
}

export interface SaveScreeningMeasurementsData {
  campaignId: string;
  operatorId: string;
  patientId: string;
  measurements: MedicalMeasurements;
  anamnesis?: ScreeningAnamnesis | null;
}

export interface CompleteScreeningPersistenceData {
  screeningId: string;
  payload: CompleteScreeningRequest;
  pdfStoragePath: string;
  completedAt: Date;
}

export interface ListCompletedScreeningsFilter {
  campaignId: string;
  patientId?: string;
  search?: string;
  from?: Date;
  to?: Date;
  campaignDay?: number;
  campaignStartDate?: Date;
}

export interface ListCompletedScreeningsParams extends ListCompletedScreeningsFilter {
  skip: number;
  take: number;
}

export interface ScreeningExportRecord {
  id: string;
  completedAt: Date;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientPhone: string | null;
  patientAge: number | null;
  patientGender: string | null;
  patientCity: string | null;
  operatorFirstName: string;
  operatorLastName: string;
  systolicBp: number | null;
  diastolicBp: number | null;
  pulse: number | null;
  oxygenSaturation: number | null;
  bloodGlucose: number | null;
  bmi: number | null;
  waistCircumferenceCm: number | null;
  hasCriticalWarning: boolean;
  hasPdf: boolean;
  hasSignature: boolean;
  signatureSignedAt: Date | null;
  signatureImageBase64: string | null;
  signatureMimeType: string | null;
  pdfFilename: string | null;
}

export interface CompletedScreeningListRecord {
  id: string;
  patientId: string | null;
  patientFirstName: string | null;
  patientLastName: string | null;
  patientPhone: string | null;
  operatorId: string;
  operatorFirstName: string;
  operatorLastName: string;
  completedAt: Date;
  pdfFilename: string | null;
  pdfStoragePath: string | null;
  clinicalEvaluation: unknown | null;
}

export interface ScreeningRepository {
  findLastMeasurementsByPatientId(patientId: string): Promise<ScreeningMeasurementsRecord | null>;
  createWithMeasurements(data: SaveScreeningMeasurementsData): Promise<ScreeningMeasurementsRecord>;
  findById(id: string): Promise<ScreeningMeasurementsRecord | null>;
  completeScreening(data: CompleteScreeningPersistenceData): Promise<ScreeningMeasurementsRecord>;
  listCompleted(params: ListCompletedScreeningsParams): Promise<{
    items: CompletedScreeningListRecord[];
    total: number;
  }>;
  listCritical(params: ListCompletedScreeningsParams): Promise<{
    items: CompletedScreeningListRecord[];
    total: number;
  }>;
  listCompletedForExport(filter: ListCompletedScreeningsFilter): Promise<ScreeningExportRecord[]>;
  countCompleted(filter: ListCompletedScreeningsFilter): Promise<number>;
}

function decimalToNumber(value: Decimal | null): number | null {
  if (value === null) return null;
  return Number(value);
}

export function mapScreeningToMeasurementsDto(
  record: ScreeningMeasurementsRecord,
): MedicalMeasurements {
  return {
    systolic_bp: record.systolicBp,
    diastolic_bp: record.diastolicBp,
    pulse: record.pulse,
    oxygen_saturation: record.oxygenSaturation,
    blood_glucose: record.bloodGlucose,
    blood_glucose_status: (record.bloodGlucoseStatus as BloodGlucoseStatus) ?? '',
    weight_kg: decimalToNumber(record.weightKg),
    height_cm: decimalToNumber(record.heightCm),
    bmi: decimalToNumber(record.bmi),
    ideal_weight_kg: null,
    waist_circumference_cm: record.waistCircumferenceCm,
    known_hypertension: record.knownHypertension,
    known_diabetes: record.knownDiabetes,
    current_antihypertensive_treatment: record.currentAntihypertensiveTreatment,
  };
}

export function mapPartialMeasurementsForComparison(
  record: ScreeningMeasurementsRecord,
): Partial<MedicalMeasurements> {
  return {
    systolic_bp: record.systolicBp,
    diastolic_bp: record.diastolicBp,
    weight_kg: decimalToNumber(record.weightKg),
    waist_circumference_cm: record.waistCircumferenceCm,
    blood_glucose: record.bloodGlucose,
  };
}
