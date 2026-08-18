const ACTIVE_PATIENT_KEY = 'medscreen_active_patient';

export function getStoredActivePatientId(userId: string): string | null {
  const raw = sessionStorage.getItem(`${ACTIVE_PATIENT_KEY}:${userId}`);
  return raw || null;
}

export function setStoredActivePatientId(userId: string, patientId: string): void {
  sessionStorage.setItem(`${ACTIVE_PATIENT_KEY}:${userId}`, patientId);
}

export function clearStoredActivePatientId(userId: string): void {
  sessionStorage.removeItem(`${ACTIVE_PATIENT_KEY}:${userId}`);
}
