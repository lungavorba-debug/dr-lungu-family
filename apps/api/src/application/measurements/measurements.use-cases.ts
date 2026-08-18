import type { SaveMeasurementsInput } from '@medscreen/shared';
import { calculateBmi, calculateIdealWeight } from '@medscreen/shared';
import type { ClinicalEngineInput, MedicalMeasurements } from '@medscreen/types';
import { AppError } from '../../lib/app-error';
import type { ScreeningAiSessionRepository } from '../../domain/repositories/screening-ai-session.repository';
import type { ScreeningRepository } from '../../domain/repositories/screening.repository';
import {
  mapPartialMeasurementsForComparison,
  mapScreeningToMeasurementsDto,
} from '../../domain/repositories/screening.repository';
import {
  mapPatientToDto,
  type PatientRepository,
} from '../../domain/repositories/patient.repository';

export class GetPreviousMeasurementsUseCase {
  constructor(private readonly screeningRepository: ScreeningRepository) {}

  async execute(patientId: string) {
    const screening = await this.screeningRepository.findLastMeasurementsByPatientId(patientId);
    if (!screening) {
      return { previous: null, previous_date: null };
    }

    return {
      previous: mapPartialMeasurementsForComparison(screening),
      previous_date: screening.createdAt.toISOString(),
    };
  }
}

export class SaveMeasurementsUseCase {
  constructor(
    private readonly screeningRepository: ScreeningRepository,
    private readonly aiSessionRepository: ScreeningAiSessionRepository,
    private readonly patientRepository: PatientRepository,
  ) {}

  async execute(input: SaveMeasurementsInput, operatorId: string) {
    const patientRecord = await this.patientRepository.findById(input.patient_id);
    if (!patientRecord) {
      throw new AppError(404, 'PATIENT_NOT_FOUND', 'Participantul nu a fost găsit.');
    }

    const patient = mapPatientToDto(patientRecord);
    const raw = input.measurements as MedicalMeasurements;
    const bmi = raw.bmi ?? calculateBmi(raw.weight_kg, raw.height_cm);
    const ideal_weight_kg =
      raw.ideal_weight_kg ?? calculateIdealWeight(raw.height_cm, patient.gender);
    const measurements: MedicalMeasurements = { ...raw, bmi, ideal_weight_kg };

    if (input.ai_session_id) {
      const session = await this.aiSessionRepository.getById(input.ai_session_id);
      if (!session) {
        throw new AppError(404, 'AI_SESSION_NOT_FOUND', 'Sesiunea AI nu a fost găsită.');
      }
      if (session.operatorId !== operatorId) {
        throw new AppError(403, 'FORBIDDEN', 'Nu aveți acces la această sesiune AI.');
      }
      if (session.screeningId) {
        throw new AppError(409, 'AI_SESSION_ALREADY_LINKED', 'Sesiunea AI este deja legată de un screening.');
      }
    }

    const screening = await this.screeningRepository.createWithMeasurements({
      campaignId: input.campaign_id,
      operatorId,
      patientId: input.patient_id,
      measurements,
      anamnesis: input.anamnesis ?? null,
    });

    if (input.ai_session_id) {
      await this.aiSessionRepository.linkScreening(input.ai_session_id, screening.id);
    }

    const savedMeasurements = mapScreeningToMeasurementsDto(screening);
    const enrichedMeasurements: MedicalMeasurements = {
      ...savedMeasurements,
      ideal_weight_kg: calculateIdealWeight(savedMeasurements.height_cm, patient.gender),
    };
    const clinicalEngineInput: ClinicalEngineInput = {
      patient_id: input.patient_id,
      campaign_id: input.campaign_id,
      screening_id: screening.id,
      measurements: enrichedMeasurements,
      captured_at: screening.createdAt.toISOString(),
    };

    return {
      screening_id: screening.id,
      measurements: enrichedMeasurements,
      clinical_engine_input: clinicalEngineInput,
    };
  }
}
