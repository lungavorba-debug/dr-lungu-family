import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Patient } from '@medscreen/types';
import { useAuth } from '../../auth/context/AuthContext';
import { apiClient } from '../../../shared/lib/api-client';
import {
  clearStoredActivePatientId,
  getStoredActivePatientId,
  setStoredActivePatientId,
} from '../lib/patient-storage';

interface PatientContextValue {
  activePatient: Patient | null;
  setActivePatient: (patient: Patient) => void;
  clearActivePatient: () => void;
}

const PatientContext = createContext<PatientContextValue | undefined>(undefined);

export function PatientProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [activePatient, setActivePatientState] = useState<Patient | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setActivePatientState(null);
      return;
    }

    const storedId = getStoredActivePatientId(user.id);
    if (!storedId) {
      setActivePatientState(null);
      return;
    }

    let cancelled = false;

    void apiClient.getPatient(storedId).then(({ patient }) => {
      if (!cancelled) {
        setActivePatientState(patient);
      }
    }).catch(() => {
      if (!cancelled) {
        clearStoredActivePatientId(user.id);
        setActivePatientState(null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user]);

  const setActivePatient = useCallback(
    (patient: Patient) => {
      if (!user) return;
      setStoredActivePatientId(user.id, patient.id);
      setActivePatientState(patient);
    },
    [user],
  );

  const clearActivePatient = useCallback(() => {
    if (user) {
      clearStoredActivePatientId(user.id);
    }
    setActivePatientState(null);
  }, [user]);

  const value = useMemo(
    () => ({
      activePatient,
      setActivePatient,
      clearActivePatient,
    }),
    [activePatient, setActivePatient, clearActivePatient],
  );

  return <PatientContext.Provider value={value}>{children}</PatientContext.Provider>;
}

export function usePatientContext(): PatientContextValue {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatientContext must be used within PatientProvider');
  }
  return context;
}
