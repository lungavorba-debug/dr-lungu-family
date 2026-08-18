export type PatientGender = 'M' | 'F';

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  age: number;
  gender: PatientGender;
  city: string;
  created_at: string;
}

export interface PatientWithHistory extends Patient {
  last_screening_date: string | null;
}

export interface CreatePatientRequest {
  first_name: string;
  last_name: string;
  phone: string;
  age: number;
  gender: PatientGender;
  city: string;
}

export interface SearchPatientsResponse {
  patients: PatientWithHistory[];
}

export interface CreatePatientResponse {
  patient: Patient;
}
