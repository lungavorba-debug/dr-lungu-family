import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { usePatientContext } from '../../patients/context/PatientContext';
import { clearPersistedAnamnesis } from '../conversation/lib/anamnesis-storage';
import { resetConversationProviders } from '../conversation/providers';
import { useScreeningSession } from '../context/ScreeningSessionContext';

export function useStartNewScreening() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { clearSession } = useScreeningSession();
  const { clearActivePatient } = usePatientContext();

  return useCallback(() => {
    clearSession();
    clearActivePatient();
    resetConversationProviders();
    if (user) {
      clearPersistedAnamnesis(user.id);
    }
    navigate('/screening', { replace: true });
  }, [clearSession, clearActivePatient, navigate, user]);
}
