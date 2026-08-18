import { useEffect, useState, type FormEvent } from 'react';
import type { Campaign } from '@medscreen/types';

export interface CampaignFormValues {
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  organizer: string;
  screening_type: string;
  notes: string;
  edition: string;
}

interface CampaignFormDialogProps {
  mode: 'create' | 'edit';
  campaign?: Campaign;
  isPending?: boolean;
  errorMessage?: string | null;
  onSubmit: (values: CampaignFormValues) => void;
  onClose: () => void;
}

function emptyValues(): CampaignFormValues {
  return {
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location: '',
    organizer: '',
    screening_type: '',
    notes: '',
    edition: '',
  };
}

function valuesFromCampaign(campaign: Campaign): CampaignFormValues {
  return {
    name: campaign.name,
    description: campaign.description ?? '',
    start_date: campaign.start_date,
    end_date: campaign.end_date,
    location: campaign.location,
    organizer: campaign.organizer ?? '',
    screening_type: campaign.screening_type ?? '',
    notes: campaign.notes ?? '',
    edition: campaign.edition ?? '',
  };
}

export function CampaignFormDialog({
  mode,
  campaign,
  isPending = false,
  errorMessage,
  onSubmit,
  onClose,
}: CampaignFormDialogProps) {
  const [values, setValues] = useState<CampaignFormValues>(
    campaign ? valuesFromCampaign(campaign) : emptyValues(),
  );

  useEffect(() => {
    if (mode === 'edit' && campaign) {
      setValues(valuesFromCampaign(campaign));
    } else if (mode === 'create') {
      setValues(emptyValues());
    }
  }, [mode, campaign]);

  const handleChange = (field: keyof CampaignFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-900">
          {mode === 'create' ? 'Creare campanie' : 'Editare campanie'}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {mode === 'create'
            ? 'Completați detaliile noii campanii de screening.'
            : 'Actualizați informațiile campaniei.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="campaign-name" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Nume campanie
            </label>
            <input
              id="campaign-name"
              type="text"
              required
              value={values.name}
              onChange={(event) => handleChange('name', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="campaign-start" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Data început
              </label>
              <input
                id="campaign-start"
                type="date"
                required
                value={values.start_date}
                onChange={(event) => handleChange('start_date', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="campaign-end" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Data încheiere
              </label>
              <input
                id="campaign-end"
                type="date"
                required
                value={values.end_date}
                onChange={(event) => handleChange('end_date', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="campaign-location" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Locație
            </label>
            <input
              id="campaign-location"
              type="text"
              required
              value={values.location}
              onChange={(event) => handleChange('location', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="campaign-organizer" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Organizator
              </label>
              <input
                id="campaign-organizer"
                type="text"
                value={values.organizer}
                onChange={(event) => handleChange('organizer', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="campaign-type" className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Tip screening
              </label>
              <input
                id="campaign-type"
                type="text"
                value={values.screening_type}
                onChange={(event) => handleChange('screening_type', event.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label htmlFor="campaign-edition" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Ediție (opțional)
            </label>
            <input
              id="campaign-edition"
              type="text"
              value={values.edition}
              onChange={(event) => handleChange('edition', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="campaign-description" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Descriere
            </label>
            <textarea
              id="campaign-description"
              rows={3}
              value={values.description}
              onChange={(event) => handleChange('description', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          <div>
            <label htmlFor="campaign-notes" className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Note interne
            </label>
            <textarea
              id="campaign-notes"
              rows={3}
              value={values.notes}
              onChange={(event) => handleChange('notes', event.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none ring-brand-primary/30 focus:ring-2"
            />
          </div>

          {errorMessage ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          ) : null}

          <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="min-h-touch rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              Anulează
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="min-h-touch rounded-xl bg-brand-primary text-sm font-semibold text-white transition hover:bg-brand-secondary disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? 'Se salvează...' : mode === 'create' ? 'Creează campania' : 'Salvează modificările'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
