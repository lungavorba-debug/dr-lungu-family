/** Normative participant report copy and layout tokens (PARTICIPANT_REPORT_SPEC). */

export const REPORT_SCHEMA_VERSION = 1 as const;

export const REPORT_TITLE = 'RAPORT DE SCREENING MEDICAL';

export const SECTION_TITLE_SUMMARY = 'Rezumat';
export const SECTION_TITLE_MEASUREMENTS = 'Măsurători';
export const SECTION_TITLE_FINDINGS = 'Ce a identificat screeningul';
export const SECTION_TITLE_RECOMMENDATIONS = 'Recomandări medicale & stil de viață';

export const MEASUREMENT_COLUMN_PARAMETER = 'Parametru';
export const MEASUREMENT_COLUMN_RESULT = 'Rezultat';
export const MEASUREMENT_COLUMN_REFERENCE_RANGE = 'Interval de referință';
export const MEASUREMENT_COLUMN_OBSERVATION = 'Observație';

export const RECOMMENDATIONS_INTRO =
  'Pe baza screeningului efectuat astăzi, vă oferim câteva recomandări simple, ușor de pus în practică:';

export const FINDINGS_INTRO =
  'În urma screeningului au fost identificate următoarele:';

export const MAX_RECOMMENDATION_ITEMS = 8;

export const PARTICIPANT_FIELD_LABEL_NAME = 'Participant';
export const PARTICIPANT_FIELD_LABEL_AGE = 'Vârsta';
export const PARTICIPANT_FIELD_LABEL_DATE = 'Data screeningului';
export const PARTICIPANT_FIELD_LABEL_TIME = 'Ora';
export const PARTICIPANT_FIELD_LABEL_REPORT_NUMBER = 'Nr. raport';
export const PARTICIPANT_FIELD_LABEL_OPERATOR = 'Operator';

export const FOOTER_SCREENING_BY_LABEL = 'Screening efectuat de:';

export const DEFAULT_MEASUREMENT_COLUMN_LABELS = {
  parameter: MEASUREMENT_COLUMN_PARAMETER,
  result: MEASUREMENT_COLUMN_RESULT,
  reference_range: MEASUREMENT_COLUMN_REFERENCE_RANGE,
  observation: MEASUREMENT_COLUMN_OBSERVATION,
} as const;

export const DEFAULT_FINDINGS_SECTION_TITLE = SECTION_TITLE_FINDINGS;
