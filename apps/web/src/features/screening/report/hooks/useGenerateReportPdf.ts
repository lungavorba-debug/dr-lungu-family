import { useCallback, useState } from 'react';

import { buildParticipantReportFilename, composeParticipantReport, PDF_GENERATOR_VERSION } from '@medscreen/shared';

import { useClinicSettingsSnapshot } from '../../../settings/context/ClinicSettingsContext';
import { apiClient } from '../../../../shared/lib/api-client';
import type { ClinicalReportProps } from '../types/clinical-report-props';
import type { StoredScreeningPdf } from '../lib/pdf-session-storage';
import { persistScreeningPdf } from '../lib/pdf-session-storage';

export function useGenerateReportPdf() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clinicSettingsSnapshot = useClinicSettingsSnapshot();

  const generate = useCallback(async (props: ClinicalReportProps): Promise<StoredScreeningPdf | null> => {
    setIsGenerating(true);
    setError(null);

    try {
      const report = composeParticipantReport(
        {
          participant: props.participant,
          campaign: props.campaign,
          screeningDate: props.screeningDate,
          operatorName: props.operatorName,
          measurements: props.measurements,
          anamnesis: props.anamnesis,
          evaluation: props.evaluation,
          screening_display: props.screeningDisplay,
        },
        clinicSettingsSnapshot,
      );

      const generated = await apiClient.generateParticipantReportPdf({
        participant_report: report as unknown as Record<string, unknown>,
        participant_signature_data_url: props.participantSignatureDataUrl ?? null,
      });

      const stored: StoredScreeningPdf = {
        filename: generated.filename || buildParticipantReportFilename(report),
        mime_type: 'application/pdf',
        base64: generated.base64,
        generated_at: generated.generated_at,
        byte_length: generated.byte_length,
        screening_id: generated.screening_id,
        generator_version: generated.generator_version ?? PDF_GENERATOR_VERSION,
      };

      persistScreeningPdf(stored.screening_id, stored);
      return stored;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nu s-a putut genera PDF-ul.');
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [clinicSettingsSnapshot]);

  return { generate, isGenerating, error };
}
