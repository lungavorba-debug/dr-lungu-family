import { useState } from 'react';
import { DashboardCampaignGate } from '../components/DashboardCampaignGate';
import { DashboardPageHeader } from '../components/DashboardPageHeader';
import { PatientResultsTable } from '../components/PatientResultsTable';
import { PatientSearchForm } from '../components/PatientSearchForm';
import { useStartScreeningWithPatient } from '../hooks/useStartScreeningWithPatient';
import { useSearchPatients } from '../../patients/hooks/usePatientQueries';

export function PatientsDirectoryPage() {
  const [searchParams, setSearchParams] = useState<{ phone?: string; search?: string } | null>(null);
  const { data: patients = [], isFetching, isError, error } = useSearchPatients(searchParams);
  const startScreeningWithPatient = useStartScreeningWithPatient();

  return (
    <DashboardCampaignGate>
      <div className="space-y-6">
        <DashboardPageHeader
          title="Pacienți"
          description="Căutați participanți înregistrați în campanie după nume sau număr de telefon."
        />

        <PatientSearchForm
          onSearch={(params) => setSearchParams(params)}
          isSearching={isFetching}
        />

        {!searchParams ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
            Introduceți un nume sau număr de telefon pentru a căuta pacienți înregistrați.
          </div>
        ) : null}

        {isError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error instanceof Error ? error.message : 'Căutarea pacienților a eșuat.'}
          </div>
        ) : null}

        {searchParams ? (
          <PatientResultsTable
            patients={patients}
            onStartScreening={startScreeningWithPatient}
          />
        ) : null}
      </div>
    </DashboardCampaignGate>
  );
}
