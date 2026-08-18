import type { ReactNode } from 'react';



interface ComparisonRowProps {
  label?: string;
  previousValue: string;
  unit?: string;
  highlight?: boolean;
  children: ReactNode;
}



export function MeasurementComparisonRow({

  label,

  previousValue,

  unit,

  highlight = false,

  children,

}: ComparisonRowProps) {

  return (

    <div

      className={`rounded-2xl border p-4 ${highlight ? 'border-amber-300 bg-amber-50/60' : 'border-slate-200 bg-white'}`}

    >

      {label ? <p className="text-sm font-semibold text-slate-800">{label}</p> : null}

      {previousValue !== '—' ? (

        <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-600">

          <span className="font-medium text-slate-500">Anterior:</span> {previousValue}

          {unit ? ` ${unit}` : ''}

        </div>

      ) : null}

      <div className="mt-3">{children}</div>

    </div>

  );

}



export function formatBloodPressure(previous: { systolic_bp?: number | null; diastolic_bp?: number | null } | null | undefined): string {

  if (!previous?.systolic_bp && !previous?.diastolic_bp) return '—';

  return `${previous?.systolic_bp ?? '—'} / ${previous?.diastolic_bp ?? '—'}`;

}



export function formatNumericPrevious(value: number | null | undefined): string {

  if (value === null || value === undefined) return '—';

  return String(value);

}


