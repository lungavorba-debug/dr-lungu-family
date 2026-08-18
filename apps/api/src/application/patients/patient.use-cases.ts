import type { CreatePatientInput } from '@medscreen/shared';
import { AppError } from '../../lib/app-error';
import type { PatientRepository } from '../../domain/repositories/patient.repository';
import {
  mapPatientToDto,
  mapPatientWithHistoryToDto,
} from '../../domain/repositories/patient.repository';

export class SearchPatientsUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(params: { phone?: string; search?: string }) {
    if (params.phone) {
      const patient = await this.patientRepository.findByPhone(params.phone);
      return patient ? [mapPatientWithHistoryToDto(patient)] : [];
    }

    if (params.search) {
      const patients = await this.patientRepository.searchByName(params.search);
      return patients.map(mapPatientWithHistoryToDto);
    }

    return [];
  }
}

export class CreatePatientUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(input: CreatePatientInput) {
    const existing = await this.patientRepository.findByPhone(input.phone);
    if (existing) {
      throw new AppError(
        409,
        'CONFLICT',
        'Există deja un pacient cu acest număr de telefon.',
        [{ field: 'phone', issue: 'Număr de telefon deja înregistrat.' }],
      );
    }

    const patient = await this.patientRepository.create({
      firstName: input.first_name,
      lastName: input.last_name,
      phone: input.phone,
      age: input.age,
      gender: input.gender,
      city: input.city,
    });

    return mapPatientToDto(patient);
  }
}

export class GetPatientUseCase {
  constructor(private readonly patientRepository: PatientRepository) {}

  async execute(id: string) {
    const patient = await this.patientRepository.findById(id);
    if (!patient) {
      return null;
    }

    return mapPatientToDto(patient);
  }
}
