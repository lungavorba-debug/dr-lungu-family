import type { Patient, PatientGender, PatientWithHistory } from '@medscreen/types';

export interface PatientRecord {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  gender: string;
  city: string;
  createdAt: Date;
}

export interface PatientWithLastScreeningRecord extends PatientRecord {
  lastScreeningDate: Date | null;
}

export interface CreatePatientData {
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  gender: PatientGender;
  city: string;
}

export interface PatientRepository {
  findByPhone(phone: string): Promise<PatientWithLastScreeningRecord | null>;
  searchByName(search: string): Promise<PatientWithLastScreeningRecord[]>;
  create(data: CreatePatientData): Promise<PatientRecord>;
  findById(id: string): Promise<PatientRecord | null>;
}

export function mapPatientToDto(record: PatientRecord): Patient {
  return {
    id: record.id,
    first_name: record.firstName,
    last_name: record.lastName,
    phone: record.phone,
    age: record.age,
    gender: record.gender as PatientGender,
    city: record.city,
    created_at: record.createdAt.toISOString(),
  };
}

export function mapPatientWithHistoryToDto(record: PatientWithLastScreeningRecord): PatientWithHistory {
  return {
    ...mapPatientToDto(record),
    last_screening_date: record.lastScreeningDate?.toISOString() ?? null,
  };
}
