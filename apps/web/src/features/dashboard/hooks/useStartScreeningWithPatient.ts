import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Patient } from '@medscreen/types';
import { useAuth } from '../../auth/context/AuthContext';
import { usePatientContext } from '../../patients/context/PatientContext';
import { clearPersistedAnamnesis } from '../../screening/conversation/lib/anamnesis-storage';
import { useScreeningSession } from '../../screening/context/ScreeningSessionContext';

export function useStartScreeningWithPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearSession } = useScreeningSession();
  const { setActivePatient } = usePatientContext();

  return useCallback(
    (patient: Patient) => {
      clearSession();
      if (user) {
        clearPersistedAnamnesis(user.id);
      }
      setActivePatient(patient);
      navigate('/screening', { replace: true });
    },
    [clearSession, navigate, setActivePatient, user],
  );
}
