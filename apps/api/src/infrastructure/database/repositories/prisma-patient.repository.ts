import type {
  CreatePatientData,
  PatientRecord,
  PatientRepository,
  PatientWithLastScreeningRecord,
} from '../../../domain/repositories/patient.repository';
import { prisma } from '../prisma.client';

function mapPatient(record: {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  age: number;
  gender: string;
  city: string;
  createdAt: Date;
}): PatientRecord {
  return {
    id: record.id,
    firstName: record.firstName,
    lastName: record.lastName,
    phone: record.phone,
    age: record.age,
    gender: record.gender,
    city: record.city,
    createdAt: record.createdAt,
  };
}

async function attachLastScreeningDate(
  patient: PatientRecord,
): Promise<PatientWithLastScreeningRecord> {
  const lastScreening = await prisma.screening.findFirst({
    where: { patientId: patient.id },
    orderBy: { createdAt: 'desc' },
    select: { createdAt: true },
  });

  return {
    ...patient,
    lastScreeningDate: lastScreening?.createdAt ?? null,
  };
}

export class PrismaPatientRepository implements PatientRepository {
  async findByPhone(phone: string): Promise<PatientWithLastScreeningRecord | null> {
    const patient = await prisma.patient.findUnique({ where: { phone } });
    if (!patient) {
      return null;
    }

    return attachLastScreeningDate(mapPatient(patient));
  }

  async searchByName(search: string): Promise<PatientWithLastScreeningRecord[]> {
    const normalized = search.trim();
    if (!normalized) {
      return [];
    }

    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: normalized, mode: 'insensitive' } },
          { lastName: { contains: normalized, mode: 'insensitive' } },
        ],
      },
      orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
      take: 20,
    });

    return Promise.all(patients.map((patient) => attachLastScreeningDate(mapPatient(patient))));
  }

  async create(data: CreatePatientData): Promise<PatientRecord> {
    const patient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        age: data.age,
        gender: data.gender,
        city: data.city,
      },
    });

    return mapPatient(patient);
  }

  async findById(id: string): Promise<PatientRecord | null> {
    const patient = await prisma.patient.findUnique({ where: { id } });
    return patient ? mapPatient(patient) : null;
  }
}
