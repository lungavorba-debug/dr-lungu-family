import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isValidRomanianPhone, normalizePhone } from '@medscreen/shared';
import type { PatientWithHistory } from '@medscreen/types';
import { useAuth } from '../../../auth/context/AuthContext';
import { useSearchPatientByPhone } from '../../../patients/hooks/usePatientQueries';
import { detectProbableGender } from '../lib/gender-detection';
import {
  clearConversationDraft,
  loadConversationDraft,
  persistConversationDraft,
} from '../lib/conversation-draft-storage';
import {
  calculateConversationProgress,
  createEmptyConversationForm,
  type ConversationFormField,
  type ConversationFormState,
} from '../types/conversation-form';

export function useScreeningDemographics() {
  const { user } = useAuth();
  const [form, setForm] = useState<ConversationFormState>(() => {
    if (user?.id) {
      const draft = loadConversationDraft(user.id);
      if (draft) return draft;
    }
    return createEmptyConversationForm();
  });
  const [lookupPhone, setLookupPhone] = useState<string | null>(null);
  const [existingPatient, setExistingPatient] = useState<PatientWithHistory | null>(null);
  const [usingExistingPatient, setUsingExistingPatient] = useState(false);
  const genderManuallySet = useRef(false);

  const { data: searchResults = [], isFetching: isSearchingPatient } =
    useSearchPatientByPhone(lookupPhone);

  useEffect(() => {
    if (!user?.id) return;
    persistConversationDraft(user.id, form);
  }, [form, user?.id]);

  useEffect(() => {
    if (!lookupPhone || isSearchingPatient) return;
    const patient = searchResults[0] ?? null;
    setExistingPatient(patient);
    if (patient && !usingExistingPatient) {
      setForm((current) => ({
        ...current,
        first_name: current.first_name || patient.first_name,
        last_name: current.last_name || patient.last_name,
        phone: patient.phone,
        age: current.age || String(patient.age),
        gender: current.gender || patient.gender,
        city: current.city || patient.city,
      }));
    }
  }, [lookupPhone, isSearchingPatient, searchResults, usingExistingPatient]);

  useEffect(() => {
    if (!isValidRomanianPhone(form.phone)) {
      setLookupPhone(null);
      if (!usingExistingPatient) setExistingPatient(null);
      return;
    }
    const normalized = normalizePhone(form.phone);
    const timeoutId = window.setTimeout(() => setLookupPhone(normalized), 400);
    return () => window.clearTimeout(timeoutId);
  }, [form.phone, usingExistingPatient]);

  const progress = useMemo(() => calculateConversationProgress(form), [form]);

  const updateField = useCallback((field: ConversationFormField, value: ConversationFormState[ConversationFormField]) => {
    if (field === 'gender') genderManuallySet.current = true;
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'first_name' && typeof value === 'string' && !genderManuallySet.current) {
        const detected = detectProbableGender(value);
        if (detected) next.gender = detected;
      }
      return next;
    });
    if (field === 'phone') setUsingExistingPatient(false);
  }, []);

  const continueWithExistingPatient = useCallback(() => {
    if (!existingPatient) return;
    setUsingExistingPatient(true);
    genderManuallySet.current = true;
    setForm((current) => ({
      ...current,
      first_name: existingPatient.first_name,
      last_name: existingPatient.last_name,
      phone: existingPatient.phone,
      age: String(existingPatient.age),
      gender: existingPatient.gender,
      city: existingPatient.city,
    }));
  }, [existingPatient]);

  const clearConversationDraftForUser = useCallback(() => {
    if (user?.id) clearConversationDraft(user.id);
  }, [user?.id]);

  return {
    form,
    updateField,
    setForm,
    progress,
    existingPatient,
    isSearchingPatient,
    usingExistingPatient,
    continueWithExistingPatient,
    clearConversationDraftForUser,
  };
}
