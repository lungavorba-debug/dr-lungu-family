import { useState } from 'react';
import type { OperatorFieldReview, ScreeningExtractionFieldName, ScreeningExtractionResult } from '@medscreen/types';
import { ANAMNESIS_FIELD_LABELS, type AnamnesisFormField } from '../types/anamnesis-form';
import { isCardiovascularScreeningExtractionField } from '../lib/screening-questions';

function confidenceLabel(confidence: number): string {
  if (confidence >= 0.85) return 'Ridicată';
  if (confidence >= 0.65) return 'Medie';
  return 'Scăzută';
}

function confidenceClass(confidence: number): string {
  if (confidence >= 0.85) return 'bg-emerald-100 text-emerald-800';
  if (confidence >= 0.65) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

interface ExtractionReviewPanelProps {
  extraction: ScreeningExtractionResult | null;
  reviews: OperatorFieldReview[];
  onToggleReview: (field: ScreeningExtractionFieldName, accepted: boolean) => void;
}

export function ExtractionReviewPanel({
  extraction,
  reviews,
  onToggleReview,
}: ExtractionReviewPanelProps) {
  const [expandedField, setExpandedField] = useState<string | null>(null);

  if (!extraction || !Object.keys(extraction.fields).length) {
    return null;
  }

  const reviewMap = new Map(reviews.map((review) => [review.field, review.accepted]));

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3">
        <h2 className="text-sm font-semibold text-slate-900">Revizuire extragere AI</h2>
        <p className="mt-1 text-xs text-slate-600">
          Confirmați sau respingeți câmpurile extrase automat. Puteți edita manual formularul înainte de salvare.
        </p>
      </header>

      <ul className="space-y-2">
        {(
          Object.entries(extraction.fields) as Array<
            [ScreeningExtractionFieldName, NonNullable<ScreeningExtractionResult['fields'][ScreeningExtractionFieldName]>]
          >
        )
          .filter(([field]) => isCardiovascularScreeningExtractionField(field))
          .map(([field, entry]) => {
          const label = ANAMNESIS_FIELD_LABELS[field as AnamnesisFormField] ?? field;
          const accepted = reviewMap.get(field);
          const sourceSentence = entry.source_sentence?.trim();

          return (
            <li
              key={field}
              className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-sm text-slate-700">{String(entry.value)}</p>
                  <span
                    className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${confidenceClass(entry.confidence)}`}
                    title={`Sursă: ${entry.source}`}
                  >
                    Încredere {confidenceLabel(entry.confidence)} ({Math.round(entry.confidence * 100)}%)
                  </span>
                  {sourceSentence ? (
                    <button
                      type="button"
                      onClick={() => setExpandedField(expandedField === field ? null : field)}
                      className="mt-1 block text-left text-xs font-medium text-brand-primary hover:underline"
                    >
                      {expandedField === field ? 'Ascunde sursa' : 'Afișează propoziția sursă'}
                    </button>
                  ) : null}
                  {expandedField === field && sourceSentence ? (
                    <p className="mt-1 rounded-lg bg-white px-2 py-1 text-xs italic text-slate-600">
                      „{sourceSentence}”
                    </p>
                  ) : null}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onToggleReview(field, true)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      accepted === true
                        ? 'bg-emerald-600 text-white'
                        : 'border border-emerald-200 bg-white text-emerald-700'
                    }`}
                  >
                    Acceptă
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleReview(field, false)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      accepted === false
                        ? 'bg-red-600 text-white'
                        : 'border border-red-200 bg-white text-red-700'
                    }`}
                  >
                    Respinge
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
