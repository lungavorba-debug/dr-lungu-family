import { Link, Navigate, useNavigate } from 'react-router-dom';
import { composeScreeningAnamnesis } from '../../conversation/lib/anamnesis-storage';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiClientError } from '../../../../shared/lib/api-client';
import { useTouchNumericInput } from '../../../../shared/hooks/useTouchNumericInput';
import { useCampaign } from '../../../campaign/context/CampaignContext';
import { ScreeningParticipantBanner } from '../../components/ScreeningParticipantBanner';
import { VoiceScreeningAssistantButton } from '../../conversation/components/VoiceScreeningAssistantButton';
import {
  applyVoiceExtractionToMeasurements,
  type MeasurementsFieldHints,
} from '../../conversation/lib/apply-voice-extraction';
import { useVoiceScreeningAssistant } from '../../conversation/hooks/useVoiceScreeningAssistant';
import {
  StickyActionButton,
  StickyScreeningActionBar,
} from '../../components/StickyScreeningActionBar';
import { ScreeningStepForwardGuard } from '../../components/ScreeningStepForwardGuard';
import { useScreeningSession } from '../../context/ScreeningSessionContext';
import {
  ChipGroup,
  NumericKeypad,
  NumericMeasurementInput,
  ReadOnlyBmiField,
  ReadOnlyIdealWeightField,
  Section,
  useFocusChain,
  WarningConfirmDialog,
} from '../components/MeasurementsFormControls';
import {
  MeasurementComparisonRow,
  formatBloodPressure,
  formatNumericPrevious,
} from '../components/MeasurementComparisonRow';
import { usePreviousMeasurements, useSaveMeasurements } from '../hooks/useMeasurementQueries';
import { scrollMeasurementFieldIntoView } from '../../../../shared/hooks/useTouchNumericInput';
import { MEASUREMENTS_TOUCH_PAGE_PADDING } from '../lib/measurements-dock-layout';
import {
  sanitizeBloodPressureValue,
  sanitizeThreeDigitIntegerValue,
  shouldAutoAdvanceMeasurementField,
  type MeasurementNumericField,
} from '../lib/numeric-field-input';
import {
  MEASUREMENT_FIELD_ORDER,
  createEmptyMeasurementsForm,
  formWithComputedAnthropometry,
  getBloodPressureOrderErrorForForm,
  getWarningsForForm,
  getWarningFields,
  measurementsToFormState,
  parseMeasurementsForm,
  type MeasurementsFormState,
} from '../types/measurements-form';

type NumericField = (typeof MEASUREMENT_FIELD_ORDER)[number];

const MEASUREMENT_SECTION_BY_FIELD: Partial<Record<string, string>> = {
  systolic_bp: 'blood-pressure',
  diastolic_bp: 'blood-pressure',
  pulse: 'vitals',
  oxygen_saturation: 'vitals',
  blood_glucose: 'glucose',
  weight_kg: 'anthropometry',
  height_cm: 'anthropometry',
  waist_circumference_cm: 'anthropometry',
};

export function ScreeningMeasurementsPage() {
  const navigate = useNavigate();
  const useTouchKeypad = useTouchNumericInput();
  const { activeCampaign, isLoading: campaignLoading } = useCampaign();
  const { activePatient, anamnesis, aiSessionId, clinicalEngineInput, measurements, measurementsDraft, setMeasurementsDraft, setMeasurementsSession, isHydrating } = useScreeningSession();
  const { data: previousData, isLoading: previousLoading } = usePreviousMeasurements(activePatient?.id);
  const saveMeasurements = useSaveMeasurements();

  const [form, setForm] = useState<MeasurementsFormState>(createEmptyMeasurementsForm);
  const [activeField, setActiveField] = useState<NumericField>('systolic_bp');
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [warningsConfirmed, setWarningsConfirmed] = useState(false);
  const [reviewField, setReviewField] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formRestored, setFormRestored] = useState(false);
  const [fieldHints, setFieldHints] = useState<MeasurementsFieldHints>({});

  const voiceAssistant = useVoiceScreeningAssistant();

  const { setRef, focusField } = useFocusChain(MEASUREMENT_FIELD_ORDER);
  const didInitialFocus = useRef(false);
  const didRestoreForm = useRef(false);
  const saveInFlightRef = useRef(false);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const warnings = useMemo(() => getWarningsForForm(form, activePatient?.gender), [form, activePatient?.gender]);
  const warningFields = useMemo(() => getWarningFields(form, activePatient?.gender), [form, activePatient?.gender]);
  const parsed = useMemo(
    () => parseMeasurementsForm(form, activePatient?.gender),
    [form, activePatient?.gender],
  );
  const idealWeightDisplay =
    parsed.ideal_weight_kg !== null ? String(parsed.ideal_weight_kg) : '';

  useEffect(() => {
    if (didRestoreForm.current || isHydrating) {
      return;
    }

    didRestoreForm.current = true;

    if (measurementsDraft) {
      setForm(
        formWithComputedAnthropometry(
          { ...createEmptyMeasurementsForm(), ...measurementsDraft },
          activePatient?.gender,
        ),
      );
      setFormRestored(true);
      return;
    }

    if (measurements) {
      setForm(formWithComputedAnthropometry(measurementsToFormState(measurements), activePatient?.gender));
      setFormRestored(true);
      return;
    }

    if (anamnesis) {
      setForm((current) => ({
        ...current,
        known_hypertension: anamnesis.known_hypertension ?? current.known_hypertension,
        known_diabetes: anamnesis.known_diabetes ?? current.known_diabetes,
        current_antihypertensive_treatment:
          anamnesis.follows_treatment ?? current.current_antihypertensive_treatment,
      }));
    }

    setFormRestored(true);
  }, [anamnesis, activePatient?.gender, isHydrating, measurements, measurementsDraft]);

  useEffect(() => {
    if (!activePatient?.gender || isHydrating) {
      return;
    }

    setForm((current) => formWithComputedAnthropometry(current, activePatient.gender));
  }, [activePatient?.gender, isHydrating]);

  useEffect(() => {
    if (isHydrating || !activePatient || !formRestored) {
      return;
    }

    setMeasurementsDraft(formWithComputedAnthropometry(form, activePatient.gender));
  }, [activePatient, form, formRestored, isHydrating, setMeasurementsDraft]);

  useEffect(() => {
    if (didInitialFocus.current) {
      return;
    }
    didInitialFocus.current = true;
    focusField('systolic_bp');
    setActiveField('systolic_bp');
  }, [focusField]);

  const updateField = useCallback(
    (field: keyof MeasurementsFormState, value: MeasurementsFormState[keyof MeasurementsFormState]) => {
      setForm((current) => {
        const next = { ...current, [field]: value };
        if (field === 'weight_kg' || field === 'height_cm') {
          return formWithComputedAnthropometry(next, activePatient?.gender);
        }
        return next;
      });
      setWarningsConfirmed(false);
      if (reviewField === field) {
        setReviewField(null);
      }
    },
    [activePatient?.gender, reviewField],
  );

  const setSectionRef = useCallback((sectionId: string) => {
    return (element: HTMLElement | null) => {
      sectionRefs.current[sectionId] = element;
    };
  }, []);

  const handleReviewWarnings = useCallback(() => {
    setShowWarningDialog(false);
    const firstField = warnings[0]?.field;
    if (!firstField) {
      return;
    }

    setReviewField(firstField);

    if (!MEASUREMENT_FIELD_ORDER.includes(firstField as NumericField)) {
      return;
    }

    const numericField = firstField as NumericField;
    setActiveField(numericField);

    requestAnimationFrame(() => {
      const sectionId = MEASUREMENT_SECTION_BY_FIELD[firstField] ?? firstField;
      sectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      focusField(numericField);
      const input = document.getElementById(numericField);
      if (input instanceof HTMLInputElement) {
        scrollMeasurementFieldIntoView(input, {
          bottomInsetPx: useTouchKeypad ? 280 : 0,
        });
        input.focus({ preventScroll: false });
      }
    });
  }, [focusField, useTouchKeypad, warnings]);

  const advanceFromField = useCallback(
    (field: NumericField) => {
      const nextField =
        field === 'systolic_bp'
          ? 'diastolic_bp'
          : MEASUREMENT_FIELD_ORDER[MEASUREMENT_FIELD_ORDER.indexOf(field) + 1];

      if (!nextField) {
        return;
      }

      setActiveField(nextField);
      focusField(nextField);
    },
    [focusField],
  );

  const setNumericFieldValue = useCallback(
    (field: NumericField, rawValue: string) => {
      if (field === 'systolic_bp' || field === 'diastolic_bp') {
        const sanitized = sanitizeBloodPressureValue(rawValue);
        updateField(field, sanitized);

        if (shouldAutoAdvanceMeasurementField(field as MeasurementNumericField, sanitized)) {
          advanceFromField(field);
        }
        return;
      }

      const sanitized = sanitizeThreeDigitIntegerValue(rawValue);
      updateField(field, sanitized);

      if (shouldAutoAdvanceMeasurementField(field as MeasurementNumericField, sanitized)) {
        advanceFromField(field);
      }
    },
    [advanceFromField, updateField],
  );

  function appendToActiveField(fragment: string) {
    const current = form[activeField];
    if (typeof current !== 'string') return;

    const digits = current.replace(/\D/g, '');
    if (digits.length >= 3) {
      return;
    }

    setNumericFieldValue(activeField, `${current}${fragment}`);
  }

  function handleDecimal() {
    // Decimal entry disabled — all measurement fields accept up to 3 digits.
  }

  function handleBackspace() {
    const current = form[activeField];
    if (typeof current !== 'string') return;
    updateField(activeField, current.slice(0, -1));
  }

  function handleKeypadDigit(digit: string) {
    appendToActiveField(digit);
  }

  function handleKeypadNext() {
    advanceFromField(activeField);
  }

  if (!campaignLoading && !activeCampaign) {
    return <Navigate to="/campaigns/select" replace />;
  }

  if (isHydrating) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
        Se restaurează sesiunea de screening...
      </div>
    );
  }

  if (!activePatient) {
    return <Navigate to="/screening" replace />;
  }

  async function performSave() {
    if (!activeCampaign || !activePatient || saveInFlightRef.current) return;

    if (clinicalEngineInput && measurements) {
      navigate('/screening/results');
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);
    setSubmitError(null);

    const payload = {
      campaign_id: activeCampaign.id,
      patient_id: activePatient.id,
      measurements: parsed,
      ...(anamnesis ? { anamnesis: composeScreeningAnamnesis(anamnesis) } : {}),
    };

    const attemptSave = (includeAiSession: boolean) =>
      saveMeasurements.mutateAsync({
        ...payload,
        ...(includeAiSession && aiSessionId ? { ai_session_id: aiSessionId } : {}),
      });

    try {
      let result;
      try {
        result = await attemptSave(Boolean(aiSessionId));
      } catch (error) {
        if (
          error instanceof ApiClientError &&
          (error.errorCode === 'AI_SESSION_NOT_FOUND' || error.errorCode === 'AI_SESSION_ALREADY_LINKED')
        ) {
          result = await attemptSave(false);
        } else {
          throw error;
        }
      }

      setMeasurementsSession(parsed, result.clinical_engine_input);
      navigate('/screening/results');
    } catch (error) {
      if (error instanceof ApiClientError) {
        setSubmitError(error.message);
      } else {
        setSubmitError('Nu s-au putut salva măsurătorile.');
      }
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  function handleSaveClick() {
    if (saveInFlightRef.current || saveMeasurements.isPending) {
      return;
    }

    const bpOrderError = getBloodPressureOrderErrorForForm(form, activePatient?.gender);
    if (bpOrderError) {
      setSubmitError(bpOrderError.message);
      focusField('systolic_bp');
      sectionRefs.current['blood-pressure']?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitError(null);

    if (warnings.length > 0 && !warningsConfirmed) {
      setShowWarningDialog(true);
      return;
    }
    void performSave();
  }

  const previous = previousData?.previous ?? null;

  function numericInputProps(
    field: NumericField,
    label: string,
    unit: string,
    options?: { hideLabel?: boolean },
  ) {
    return {
      id: field,
      label,
      unit,
      hideLabel: options?.hideLabel,
      value: form[field] as string,
      useTouchKeypad,
      onChange: (value: string) => setNumericFieldValue(field, value),
      onComplete: () => advanceFromField(field),
      onFocus: () => setActiveField(field),
      highlight: warningFields.has(field),
      reviewHighlight: reviewField === field,
      aiHint: fieldHints[field],
      inputRef: setRef(field),
    };
  }

  async function handleStopVoiceAssistant() {
    const result = await voiceAssistant.stopRecording();
    if (!result) return;
    const merged = applyVoiceExtractionToMeasurements(form, result.extraction);
    setForm(merged.form);
    setFieldHints((current) => ({ ...current, ...merged.hints }));
  }

  return (
    <ScreeningStepForwardGuard step="measurements">
    <div className={useTouchKeypad ? MEASUREMENTS_TOUCH_PAGE_PADDING : 'pb-28'}>
      <div className="mx-auto max-w-4xl space-y-4">
        <ScreeningParticipantBanner patient={activePatient} stepLabel="Măsurători medicale" />

        <header className="rounded-2xl border border-brand-primary/15 bg-white p-4 shadow-medical sm:p-6">
          <Link to="/screening" className="text-sm font-medium text-brand-primary hover:underline">
            ← Înapoi la conversație
          </Link>
          <h1 className="mt-3 text-2xl font-bold text-slate-900">Măsurători medicale</h1>
          {previousLoading ? (
            <p className="mt-2 text-xs text-slate-500">Se încarcă măsurătorile anterioare...</p>
          ) : null}
        </header>

        <VoiceScreeningAssistantButton
          status={voiceAssistant.status}
          recordingSeconds={voiceAssistant.recordingSeconds}
          error={voiceAssistant.error}
          aiLoading={voiceAssistant.aiLoading}
          aiUnavailable={voiceAssistant.aiUnavailable}
          aiProvider={voiceAssistant.aiProvider}
          isSupported={voiceAssistant.isSupported}
          onStart={() => void voiceAssistant.startRecording()}
          onStop={() => void handleStopVoiceAssistant()}
          onRefreshAi={() => void voiceAssistant.refreshAiAvailability()}
        />

        <div ref={setSectionRef('blood-pressure')}>
        <Section title="Tensiune arterială">
          <MeasurementComparisonRow
            previousValue={formatBloodPressure(previous)}
            unit="mmHg"
            highlight={warningFields.has('systolic_bp') || warningFields.has('diastolic_bp')}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <NumericMeasurementInput
                {...numericInputProps('systolic_bp', 'Sistolică', 'mmHg')}
              />
              <NumericMeasurementInput
                {...numericInputProps('diastolic_bp', 'Diastolică', 'mmHg')}
              />
            </div>
          </MeasurementComparisonRow>
        </Section>
        </div>

        <div ref={setSectionRef('vitals')} className="grid gap-4 sm:grid-cols-2">
          <NumericMeasurementInput {...numericInputProps('pulse', 'Puls', 'bpm')} />
          <NumericMeasurementInput {...numericInputProps('oxygen_saturation', 'Saturație oxigen', '%')} />
        </div>

        <div ref={setSectionRef('glucose')}>
        <MeasurementComparisonRow
          label="Glicemie"
          previousValue={formatNumericPrevious(previous?.blood_glucose)}
          unit="mg/dL"
          highlight={warningFields.has('blood_glucose')}
        >
          <div className="space-y-3">
            <NumericMeasurementInput
              {...numericInputProps('blood_glucose', 'Glicemie', 'mg/dL', { hideLabel: true })}
            />
            <ChipGroup
              label="Tip recoltare"
              value={form.blood_glucose_status}
              options={[
                { value: 'fasting', label: 'A jeun (pe nemâncate)' },
                { value: 'non_fasting', label: 'Postprandial (după masă)' },
              ]}
              onChange={(value) =>
                updateField('blood_glucose_status', value as MeasurementsFormState['blood_glucose_status'])
              }
            />
          </div>
        </MeasurementComparisonRow>
        </div>

        <div ref={setSectionRef('anthropometry')} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <MeasurementComparisonRow
            label="Greutate"
            previousValue={formatNumericPrevious(previous?.weight_kg)}
            unit="kg"
          >
            <NumericMeasurementInput
              {...numericInputProps('weight_kg', 'Greutate', 'kg', { hideLabel: true })}
            />
          </MeasurementComparisonRow>

          <NumericMeasurementInput {...numericInputProps('height_cm', 'Înălțime', 'cm')} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyBmiField value={form.bmi} />
          <ReadOnlyIdealWeightField value={idealWeightDisplay} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <MeasurementComparisonRow
            label="Circumferință abdominală"
            previousValue={formatNumericPrevious(previous?.waist_circumference_cm)}
            unit="cm"
          >
            <NumericMeasurementInput
              {...numericInputProps('waist_circumference_cm', 'Circumferință abdominală', 'cm', {
                hideLabel: true,
              })}
            />
          </MeasurementComparisonRow>
        </div>
        </div>

        {submitError ? (
          <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        ) : null}
      </div>

      {useTouchKeypad ? (
        <div className="fixed inset-x-0 bottom-0 z-40 flex flex-col">
          <StickyScreeningActionBar layout="inline" density="compact">
            <StickyActionButton
              density="compact"
              disabled={isSaving || saveMeasurements.isPending}
              onClick={handleSaveClick}
            >
              {saveMeasurements.isPending ? 'Se salvează...' : 'Salvează măsurătorile'}
            </StickyActionButton>
          </StickyScreeningActionBar>
          <NumericKeypad
            onDigit={handleKeypadDigit}
            onDecimal={handleDecimal}
            onBackspace={handleBackspace}
            onNext={handleKeypadNext}
          />
        </div>
      ) : (
        <StickyScreeningActionBar>
          <StickyActionButton disabled={isSaving || saveMeasurements.isPending} onClick={handleSaveClick}>
            {saveMeasurements.isPending ? 'Se salvează...' : 'Salvează măsurătorile'}
          </StickyActionButton>
        </StickyScreeningActionBar>
      )}

      {showWarningDialog ? (
        <WarningConfirmDialog
          warnings={warnings}
          onCancel={handleReviewWarnings}
          onConfirm={() => {
            setWarningsConfirmed(true);
            setShowWarningDialog(false);
            void performSave();
          }}
        />
      ) : null}
    </div>
    </ScreeningStepForwardGuard>
  );
}
