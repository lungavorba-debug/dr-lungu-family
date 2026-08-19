import { useCallback, useState } from 'react';

import {
  buildParticipantReportFilename,
  composeParticipantReport,
  PDF_GENERATOR_VERSION,
} from '@medscreen/shared';

import { useClinicSettingsSnapshot } from '../../../settings/context/ClinicSettingsContext';
import type { ClinicalReportProps } from '../types/clinical-report-props';
import type { StoredScreeningPdf } from '../lib/pdf-session-storage';
import { persistScreeningPdf } from '../lib/pdf-session-storage';
import { generateClientReportPdf } from '../lib/generate-client-report-pdf';

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

      const generatedAt = new Date().toISOString();
      const clientPdf = await generateClientReportPdf({
        report,
        participantSignatureDataUrl: props.participantSignatureDataUrl ?? null,
      });

      const stored: StoredScreeningPdf = {
        filename: buildParticipantReportFilename(report),
        mime_type: 'application/pdf',
        base64: clientPdf.base64,
        generated_at: generatedAt,
        byte_length: clientPdf.byte_length,
        screening_id: report.metadata.report_id,
        generator_version: PDF_GENERATOR_VERSION,
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
