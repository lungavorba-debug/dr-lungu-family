import type { ClinicalEvaluationResult, ClinicalRiskAssessment, ClinicalRiskLevel } from '@medscreen/types';
import {
  getParticipantRiskExplanation,
  getRiskLevelLabelRo,
  RISK_CARD_TITLES,
  sanitizeParticipantFacingText,
  translateInterpretationSectionTitle,
  translateRiskOverviewLine,
} from '@medscreen/shared';

const LEVEL_STYLES: Record<ClinicalRiskLevel, { badge: string; border: string }> = {
  unknown: { badge: 'bg-slate-100 text-slate-600', border: 'border-slate-200' },
  low: { badge: 'bg-brand-accent/15 text-brand-accent', border: 'border-brand-accent/30' },
  moderate: { badge: 'bg-amber-100 text-amber-800', border: 'border-amber-300' },
  elevated: { badge: 'bg-red-100 text-red-800', border: 'border-red-300' },
};

export function RiskAssessmentCard({ assessment }: { assessment: ClinicalRiskAssessment }) {
  const styles = LEVEL_STYLES[assessment.level];
  const explanation = getParticipantRiskExplanation(assessment.category, assessment.level);
  const factors = assessment.factors
    .map((factor) => sanitizeParticipantFacingText(factor))
    .filter((factor) => factor.length > 0);

  return (
    <div className={`rounded-2xl border p-4 ${styles.border} bg-white`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-900">
          {RISK_CARD_TITLES[assessment.category]}
        </h3>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles.badge}`}>
          {getRiskLevelLabelRo(assessment.level)}
        </span>
      </div>
      <p className="mt-2 text-sm text-slate-600">{explanation}</p>
      {factors.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {factors.map((factor) => (
            <li key={factor} className="text-sm text-slate-500">
              • {factor}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ClinicalWarningsList({
  warnings,
}: {
  warnings: ClinicalEvaluationResult['warnings'];
}) {
  if (warnings.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Avertismente</h2>
      <ul className="space-y-2">
        {warnings.map((warning) => (
          <li
            key={warning.code}
            className={`rounded-xl px-4 py-3 text-sm ${
              warning.severity === 'critical'
                ? 'border border-red-200 bg-red-50 text-red-800'
                : warning.severity === 'attention'
                  ? 'border border-amber-200 bg-amber-50 text-amber-800'
                  : 'border border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            {sanitizeParticipantFacingText(warning.message)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ClinicalRecommendationsList({
  recommendations,
}: {
  recommendations: ClinicalEvaluationResult['recommendations'];
}) {
  if (recommendations.length === 0) return null;

  const PRIORITY_LABELS: Record<string, string> = {
    urgent: 'Important',
    soon: 'Ridicată',
    routine: 'Generală',
  };

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Recomandări</h2>
      <ul className="space-y-2">
        {recommendations.map((rec) => (
          <li key={rec.code} className="rounded-xl border border-brand-primary/15 bg-white px-4 py-3 text-sm text-slate-700">
            <span className="mr-2 inline-flex rounded-full bg-brand-primary/10 px-2 py-0.5 text-xs font-semibold uppercase text-brand-primary">
              {PRIORITY_LABELS[rec.priority] ?? rec.priority}
            </span>
            {sanitizeParticipantFacingText(rec.message)}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ClinicalInterpretationPanel({
  interpretation,
}: {
  interpretation: ClinicalEvaluationResult['interpretation'];
}) {
  const summary = sanitizeParticipantFacingText(interpretation.summary);
  const sections = interpretation.sections
    .map((section) => {
      const title = translateInterpretationSectionTitle(section.title);
      if (!title) return null;

      const content =
        title === 'Sumar riscuri'
          ? section.content
              .split('\n')
              .map((line) => translateRiskOverviewLine(line))
              .join('\n')
          : sanitizeParticipantFacingText(section.content);

      if (!content.trim()) return null;
      return { title, content };
    })
    .filter((section): section is { title: string; content: string } => section !== null);

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-slate-900">Interpretare</h2>
      <div className="rounded-2xl border border-brand-primary/15 bg-brand-primary/5 p-4">
        {summary ? <p className="text-base font-medium text-slate-900">{summary}</p> : null}
        {sections.length > 0 ? (
          <div className={`space-y-3 ${summary ? 'mt-4' : ''}`}>
            {sections.map((section) => (
              <div key={section.title}>
                <h3 className="text-sm font-semibold text-slate-800">{section.title}</h3>
                <p className="mt-1 whitespace-pre-line text-sm text-slate-600">{section.content}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
