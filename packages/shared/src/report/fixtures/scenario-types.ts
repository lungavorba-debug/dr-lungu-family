import type { MedicalMeasurements, ScreeningAnamnesis } from '@medscreen/types';
import type { PatientGender } from '@medscreen/types';
import type { CampaignReportInfo } from '../campaign-display';

/** Deterministic golden scenario identifiers (Phase 0). */
export type GoldenScenarioId = 'healthy' | 'elevated-bp' | 'multi-finding' | 'chest-pain';

export const GOLDEN_SCENARIO_IDS: readonly GoldenScenarioId[] = [
  'healthy',
  'elevated-bp',
  'multi-finding',
  'chest-pain',
] as const;

/** Raw screening input for a golden scenario — evaluation is computed at test/runtime. */
export interface GoldenScenarioFixture {
  id: GoldenScenarioId;
  screening_id: string;
  patient_id: string;
  campaign_id: string;
  captured_at: string;
  participant: {
    first_name: string;
    last_name: string;
    gender: PatientGender;
    age: number;
  };
  campaign: CampaignReportInfo;
  operatorName: string;
  measurements: MedicalMeasurements;
  anamnesis: ScreeningAnamnesis;
}
