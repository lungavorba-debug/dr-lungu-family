import { composeParticipantReport } from '@medscreen/shared';

import { useClinicSettingsSnapshot } from '../../../settings/context/ClinicSettingsContext';
import type { ClinicalReportProps } from '../types/clinical-report-props';
import { ClinicalReportView } from './ClinicalReportView';

function propsToInput(props: ClinicalReportProps) {
  return {
    participant: props.participant,
    campaign: props.campaign,
    screeningDate: props.screeningDate,
    operatorName: props.operatorName,
    measurements: props.measurements,
    anamnesis: props.anamnesis,
    evaluation: props.evaluation,
    screening_display: props.screeningDisplay,
  };
}

export function getParticipantReport(
  props: ClinicalReportProps,
  clinicSettings?: Parameters<typeof composeParticipantReport>[1],
) {
  return composeParticipantReport(propsToInput(props), clinicSettings);
}

/** @deprecated Use getParticipantReport(). */
export function getClinicalReportContent(props: ClinicalReportProps) {
  return getParticipantReport(props);
}

export { ClinicalReportView } from './ClinicalReportView';
export type { ClinicalReportViewProps } from './ClinicalReportView';

/** Participant-facing clinical report — same pipeline as PDF generation. */
export function ClinicalReport({
  participant,
  campaign,
  screeningDate,
  operatorName,
  measurements,
  anamnesis,
  evaluation,
  screeningDisplay,
  participantSignatureDataUrl,
  presentationMode = 'screen',
}: ClinicalReportProps) {
  const clinicSettingsSnapshot = useClinicSettingsSnapshot();
  const report = composeParticipantReport(
    propsToInput({
      participant,
      campaign,
      screeningDate,
      operatorName,
      measurements,
      anamnesis,
      evaluation,
      screeningDisplay,
    }),
    clinicSettingsSnapshot,
  );

  return (
    <ClinicalReportView
      report={report}
      participantSignatureDataUrl={participantSignatureDataUrl}
      presentationMode={presentationMode}
    />
  );
}
