import type { ReactNode } from 'react';
import { useState } from 'react';
import type {
  ParticipantReport,
  ReportMeasurementRow,
  ReportMeasurementStatusLevel,
  ReportRecommendation,
} from '@medscreen/shared';

import { SECTION_TITLE_MEASUREMENTS, SECTION_TITLE_RECOMMENDATIONS } from '@medscreen/shared';
import { formatPhoneDisplay } from '@medscreen/shared';

import {
  participantFieldIcon,
  pickRecommendationIcon,
  screeningAnswerBadgeClass,
} from './report-presentation.helpers';
import {
  IconGlobe,
  IconMail,
  IconMapPin,
  IconPhone,
} from './report-presentation-icons';
import {
  REPORT_CLINIC_LOGO_SRC,
  REPORT_NATURALIS_LOGO_SRC,
  REPORT_ORGANIZER_LOGO_SRC,
  REPORT_QR_IMAGE_SRC,
} from '../constants/report-branding-assets';

function formatUpper(value: string): string {
  return value.toUpperCase();
}

function ReportQrImage({ label, imageSrc }: { label: string; imageSrc: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  const labelLines = label.includes('site-ul oficial')
    ? ['Scanează pentru', 'site-ul oficial']
    : [label];

  return (
    <div className="report-header-qr flex shrink-0 flex-col items-center">
      <div className="report-header-qr-box flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-[0_1px_4px_rgba(0,61,91,0.08)]">
        {imageFailed ? (
          <span className="px-1 text-center text-[7px] font-medium leading-snug text-slate-400">Cod QR</span>
        ) : (
          <img
            src={imageSrc}
            alt={label}
            className="report-brand-image h-full w-full object-contain"
            decoding="sync"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className="report-header-qr-caption mt-1.5 w-[78px] space-y-0.5 text-center">
        {labelLines.map((line) => (
          <p key={line} className="text-[5.5px] font-normal leading-[1.35] text-slate-500">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

function HeaderAccentLine({ className = '' }: { className?: string }) {
  return <div className={`report-header-accent-h ${className}`} aria-hidden="true" />;
}

function PartnerColumn({
  label,
  name,
  logoSrc,
  logoAlt,
  logoVariant = 'default',
  textOnly = false,
  showNameBelowLogo = false,
}: {
  label: string;
  name: string;
  logoSrc?: string;
  logoAlt?: string;
  logoVariant?: 'default' | 'banner';
  textOnly?: boolean;
  showNameBelowLogo?: boolean;
}) {
  const logoClassName =
    logoVariant === 'banner'
      ? 'max-h-[48px] w-full max-w-[220px] object-contain'
      : 'max-h-[52px] w-auto max-w-full object-contain';

  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
      <p className="w-full text-[8px] font-bold uppercase tracking-wide text-brand-primary">{label}</p>
      {textOnly ? (
        <div className="flex min-h-[52px] w-full items-center justify-center rounded-lg border border-brand-primary/10 bg-slate-50/60 px-3 py-2">
          <p className="text-[10px] font-semibold leading-snug text-brand-primary">{name}</p>
        </div>
      ) : (
        <div
          className={`flex w-full items-center justify-center rounded-lg border border-brand-primary/10 bg-white px-3 ${
            logoVariant === 'banner' ? 'min-h-[52px] py-2' : 'min-h-[52px] py-2'
          }`}
        >
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={logoAlt ?? name}
              className={`report-brand-image ${logoClassName}`}
              decoding="sync"
            />
          ) : (
            <p className="text-[10px] font-semibold leading-snug text-brand-primary">{name}</p>
          )}
        </div>
      )}
      {logoSrc && showNameBelowLogo ? (
        <p className="max-w-[220px] text-[9px] font-semibold leading-snug text-slate-700">{name}</p>
      ) : null}
    </div>
  );
}

function SectionHeading({
  children,
  className = '',
  uppercase = false,
}: {
  children: string;
  className?: string;
  uppercase?: boolean;
}) {
  return (
    <h2
      className={`report-section-title text-[9px] font-semibold leading-snug text-brand-primary ${
        uppercase ? 'uppercase tracking-wide' : ''
      } ${className}`}
    >
      {children}
    </h2>
  );
}

function CardShell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-[0_2px_8px_rgba(0,61,91,0.04)] ${className}`}
    >
      {children}
    </section>
  );
}

function ContactLine({
  icon,
  children,
}: {
  icon: 'address' | 'phone' | 'website' | 'email';
  children: string;
}) {
  const icons = {
    address: IconMapPin,
    phone: IconPhone,
    website: IconGlobe,
    email: IconMail,
  };
  const Icon = icons[icon];

  return (
    <p className="flex items-start gap-2 text-[9px] leading-relaxed text-slate-600">
      <span
        className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center text-brand-primary/50"
        aria-hidden="true"
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <span>{children}</span>
    </p>
  );
}

const BADGE_STYLES: Record<ReportMeasurementStatusLevel, string> = {
  normal: 'bg-emerald-50 text-emerald-800 ring-emerald-200/80',
  attention: 'bg-amber-50 text-amber-900 ring-amber-200/80',
  critical: 'bg-red-50 text-red-800 ring-red-200/80',
  neutral: 'bg-slate-50 text-slate-500 ring-slate-200/80',
};

const ABNORMAL_ROW_STYLES: Record<ReportMeasurementStatusLevel, string> = {
  normal: '',
  attention: 'bg-amber-50/60',
  critical: 'bg-red-50/70',
  neutral: '',
};

function InterpretationBadge({ level, label }: { level: ReportMeasurementStatusLevel; label: string }) {
  if (!label || label.trim() === '' || label === '—') {
    return null;
  }

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-semibold ring-1 ring-inset ${BADGE_STYLES[level]}`}
    >
      {label}
    </span>
  );
}

function ScreeningAnswerBadge({ answer }: { answer: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-semibold ring-1 ring-inset ${screeningAnswerBadgeClass(answer)}`}
    >
      {answer}
    </span>
  );
}

function RecommendationText({ text, code }: { text: string; code: string }) {
  if (code.startsWith('standard_action_') || code === 'medical_consult') {
    return <strong className="font-semibold text-slate-900">{text}</strong>;
  }

  if (code.startsWith('lifestyle_')) {
    const colonIndex = text.indexOf(':');
    if (colonIndex > 0) {
      return (
        <>
          <strong className="font-semibold text-slate-900">{text.slice(0, colonIndex + 1)}</strong>
          {text.slice(colonIndex + 1)}
        </>
      );
    }
  }

  return <span>{text}</span>;
}

function EducationTipCard({
  title,
  items,
  highlighted = false,
}: {
  title: string;
  items: readonly string[];
  highlighted?: boolean;
}) {
  if (highlighted) {
    return (
      <CardShell className="border-2 border-brand-primary/35 bg-gradient-to-br from-brand-primary/[0.1] via-white to-brand-accent/[0.06] px-5 py-4 shadow-[0_6px_20px_rgba(0,61,91,0.1)]">
        <h3 className="text-[12px] font-bold leading-snug text-brand-primary">{title}</h3>
        <ul className="mt-3.5 space-y-2.5">
          {items.map((tip) => (
            <li key={tip} className="flex gap-2.5 text-[10.5px] leading-relaxed text-slate-800">
              <span className="mt-0.5 text-[11px] font-bold text-brand-accent">•</span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </CardShell>
    );
  }

  return (
    <CardShell className="px-4 py-3">
      <h3 className="report-section-title text-[9px] font-semibold leading-snug text-brand-primary">{title}</h3>
      <ul className="mt-2.5 space-y-1.5">
        {items.map((tip) => (
          <li key={tip} className="flex gap-2 text-[9px] leading-relaxed text-slate-700">
            <span className="mt-0.5 font-bold text-brand-accent">•</span>
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </CardShell>
  );
}

/** Clinic header — two-row layout per reference (no full-span dividers). */
export function ClinicalReportClinicHeader({ report }: { report: ParticipantReport }) {
  const { copy } = report.layout;
  const qrImageSrc = report.qr.image_src ?? REPORT_QR_IMAGE_SRC;

  return (
    <header className="report-header overflow-hidden rounded-2xl border border-brand-primary/10 bg-white shadow-[0_2px_12px_rgba(0,61,91,0.05)]">
      {/* Rând sus: logo | titlu centrat | QR — coloane egale pentru centrare reală pe pagină */}
      <div className="report-header-top grid grid-cols-3 items-start gap-3 px-4 pt-4 sm:gap-4 sm:px-5">
        <div className="report-header-brand min-w-0 justify-self-start">
          <img
            src={REPORT_CLINIC_LOGO_SRC}
            alt={report.clinic.name}
            className="report-brand-image h-auto w-full max-w-[148px] object-contain object-left"
            decoding="sync"
          />
          <HeaderAccentLine className="mt-2.5" />
        </div>

        <div className="report-header-title min-w-0 self-start justify-self-center px-1 text-center">
          <p className="text-[13px] font-bold uppercase leading-tight tracking-wide text-brand-primary">
            {formatUpper(copy.header_campaign_label)}
          </p>
          <HeaderAccentLine className="mx-auto mt-1.5 max-w-[210px]" />
          <p className="mt-1.5 text-[8.5px] font-bold uppercase leading-snug text-brand-primary/90">
            {formatUpper(report.event.festival_name)}
          </p>
          {report.event.edition ? (
            <p className="mt-0.5 text-[8.5px] font-bold uppercase leading-snug text-brand-primary/90">
              {formatUpper(report.event.edition)}
            </p>
          ) : null}
        </div>

        <div className="report-header-qr-wrap min-w-0 justify-self-end sm:pt-0.5">
          <ReportQrImage label={copy.qr_label} imageSrc={qrImageSrc} />
        </div>
      </div>

      {/* Rând jos: contact | parteneri — același nivel orizontal */}
      <div className="report-header-bottom flex flex-col gap-3 px-4 pb-4 pt-1 sm:flex-row sm:items-start sm:gap-4 sm:px-5 sm:pb-4">
        <div className="report-header-contact shrink-0 space-y-1 sm:w-[34%] sm:pt-0.5">
          <ContactLine icon="address">{report.clinic.address}</ContactLine>
          <ContactLine icon="phone">{`Tel: ${formatPhoneDisplay(report.clinic.phone)}`}</ContactLine>
          <ContactLine icon="website">{report.clinic.website}</ContactLine>
          {report.clinic.email ? <ContactLine icon="email">{report.clinic.email}</ContactLine> : null}
        </div>

        <div className="report-header-partners min-w-0 flex-1">
          <p className="text-center text-[8px] font-bold uppercase tracking-wide text-brand-primary">
            {formatUpper(copy.partners_title)}
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <PartnerColumn
              label={formatUpper(copy.partner_organizer_label)}
              name={copy.partner_organizer_name}
              logoSrc={REPORT_ORGANIZER_LOGO_SRC}
              logoAlt={copy.partner_organizer_name}
              logoVariant="banner"
            />
            <PartnerColumn
              label={formatUpper(copy.partner_local_support_label)}
              name={copy.partner_local_support_name}
              textOnly
            />
            <PartnerColumn
              label={formatUpper(copy.partner_official_label)}
              name={copy.partner_naturalis}
              logoSrc={REPORT_NATURALIS_LOGO_SRC}
              logoAlt={copy.partner_naturalis}
              logoVariant="banner"
            />
          </div>
        </div>
      </div>
    </header>
  );
}

function ParticipantField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const FieldIcon = participantFieldIcon(label);

  return (
    <div className="grid grid-cols-[minmax(0,42%)_minmax(0,1fr)] items-baseline gap-x-3 gap-y-0.5 border-b border-slate-100 py-1.5 last:border-b-0">
      <dt className="flex items-center gap-1 text-[8px] font-semibold uppercase tracking-wide text-slate-500">
        {FieldIcon ? (
          <FieldIcon className="h-3 w-3 shrink-0 text-brand-primary/45" aria-hidden="true" />
        ) : null}
        {label}
      </dt>
      <dd className="text-[10px] font-semibold leading-snug text-slate-800">{value}</dd>
    </div>
  );
}

export function ClinicalReportParticipantSection({ report }: { report: ParticipantReport }) {
  const leftRows = [
    { label: 'Nume', value: report.participant.last_name },
    { label: 'Prenume', value: report.participant.first_name },
    { label: 'Vârstă', value: `${report.participant.age} ani` },
    { label: 'Sex', value: report.participant.gender_label ?? '—' },
    {
      label: 'Telefon',
      value: report.participant.phone ? formatPhoneDisplay(report.participant.phone) : '—',
    },
    { label: 'Localitate', value: report.participant.city ?? '—' },
  ];

  const rightRows = [
    { label: 'Data screeningului', value: report.metadata.screening_date.date_line },
    { label: 'Ora', value: report.metadata.screening_date.time_line },
    { label: 'Număr raport', value: report.metadata.report_number },
    { label: 'Campania', value: report.event.work_point },
    { label: 'Operator', value: report.footer.operator_name || '—' },
  ];

  return (
    <CardShell className="px-5 py-4">
      <SectionHeading uppercase>Date participant</SectionHeading>
      <div className="mt-2.5 grid grid-cols-1 gap-x-8 md:grid-cols-2">
        <dl>
          {leftRows.map((row) => (
            <ParticipantField key={row.label} label={row.label} value={row.value} />
          ))}
        </dl>
        <dl>
          {rightRows.map((row) => (
            <ParticipantField key={row.label} label={row.label} value={row.value} />
          ))}
        </dl>
      </div>
    </CardShell>
  );
}

function MeasurementsTable({ report }: { report: ParticipantReport }) {
  const { rows } = report.measurements;
  const labels = report.layout.measurement_labels;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200/80">
      <table className="w-full table-fixed text-left text-[9px]">
        <colgroup>
          <col className="w-[44%]" />
          <col className="w-[26%]" />
          <col className="w-[30%]" />
        </colgroup>
        <thead className="border-b border-brand-primary/10 bg-brand-primary/[0.04] text-[8px] uppercase tracking-wide text-brand-primary">
          <tr>
            <th className="px-2.5 py-1.5 text-left font-semibold">{labels.parameter}</th>
            <th className="px-2.5 py-1.5 text-right font-semibold">{labels.value}</th>
            <th className="px-2.5 py-1.5 text-left font-semibold">{labels.interpretation}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row: ReportMeasurementRow, index: number) => {
            const isAbnormal = row.status_level === 'attention' || row.status_level === 'critical';
            return (
              <tr
                key={row.parameter}
                className={`border-b border-slate-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} ${ABNORMAL_ROW_STYLES[row.status_level]}`}
              >
                <td className="px-2.5 py-1.5 align-middle font-medium leading-snug text-slate-600">
                  {row.parameter}
                </td>
                <td
                  className={`px-2.5 py-1.5 text-right align-middle font-semibold tabular-nums ${isAbnormal ? 'text-red-800' : 'text-slate-900'}`}
                >
                  {row.result}
                </td>
                <td className="px-2.5 py-1.5 align-middle">
                  <InterpretationBadge level={row.status_level} label={row.status_label} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function RiskFactorsTable({ report }: { report: ParticipantReport }) {
  const questions = report.layout.screening_questions;

  if (questions.length === 0) {
    return (
      <p className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-4 text-center text-[9px] text-slate-500">
        Nu au fost înregistrate răspunsuri la factorii de risc.
      </p>
    );
  }

  return (
    <div className="report-screening-questions-table overflow-hidden rounded-xl border border-slate-200/80">
      <table className="w-full table-fixed text-left text-[9px]">
        <colgroup>
          <col className="w-[58%]" />
          <col className="w-[42%]" />
        </colgroup>
        <thead className="border-b border-brand-primary/10 bg-brand-primary/[0.04] text-[8px] uppercase tracking-wide text-brand-primary">
          <tr>
            <th className="px-2.5 py-1.5 text-left font-semibold">Factor</th>
            <th className="px-2.5 py-1.5 text-left font-semibold">Răspuns</th>
          </tr>
        </thead>
        <tbody>
          {questions.map((row, index) => (
            <tr
              key={row.topic}
              className={`border-b border-slate-100 last:border-b-0 ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
            >
              <td className="px-2.5 py-1.5 font-medium leading-snug text-slate-600">{row.topic}</td>
              <td className="px-2.5 py-1.5">
                <ScreeningAnswerBadge answer={row.answer} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ClinicalReportMeasurementsAndRiskFactors({ report }: { report: ParticipantReport }) {
  return (
    <div className="grid grid-cols-1 gap-4 print:grid-cols-2">
      <CardShell className="min-w-0 px-4 py-3">
        <SectionHeading uppercase>{SECTION_TITLE_MEASUREMENTS}</SectionHeading>
        <div className="mt-2">
          <MeasurementsTable report={report} />
        </div>
      </CardShell>
      <CardShell className="min-w-0 px-4 py-3">
        <div className="report-screening-questions-block">
          <SectionHeading className="report-screening-questions-title">
            {report.layout.copy.screening_questions_title}
          </SectionHeading>
          <div className="report-screening-questions-body mt-2.5">
            <RiskFactorsTable report={report} />
          </div>
        </div>
      </CardShell>
    </div>
  );
}

export function ClinicalReportCardiovascularRisk({ report }: { report: ParticipantReport }) {
  const risk = report.layout.cardiovascular_risk;

  return (
    <CardShell className="border border-brand-primary/15 bg-gradient-to-br from-brand-primary/[0.04] via-white to-brand-accent/[0.03] px-5 py-4">
      <SectionHeading>{risk.title}</SectionHeading>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-700">{risk.summary}</p>
    </CardShell>
  );
}

export function ClinicalReportRecommendations({
  intro,
  items,
}: {
  intro: string;
  items: ReportRecommendation[];
}) {
  if (items.length === 0) return null;

  return (
    <CardShell className="border-l-4 border-l-brand-accent bg-brand-accent/[0.03] px-5 py-4">
      <SectionHeading uppercase>{SECTION_TITLE_RECOMMENDATIONS}</SectionHeading>
      <p className="mt-2 text-[10px] leading-relaxed text-slate-700">{intro}</p>
      <ul className="mt-2.5 space-y-2">
        {items.map((item) => {
          const RecIcon = pickRecommendationIcon(item.text, item.code);
          return (
            <li key={`${item.code}-${item.text}`} className="flex gap-2.5 text-[10px] leading-relaxed text-slate-800">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-brand-accent/20 bg-white text-brand-accent"
                aria-hidden="true"
              >
                <RecIcon className="h-3 w-3" />
              </span>
              <span>
                <RecommendationText text={item.text} code={item.code} />
              </span>
            </li>
          );
        })}
      </ul>
    </CardShell>
  );
}

export function ClinicalReportEducationBoxes({ report }: { report: ParticipantReport }) {
  const { copy } = report.layout;

  return (
    <section className="flex flex-col gap-4">
      <EducationTipCard
        highlighted
        title={copy.blood_pressure_education_title}
        items={copy.blood_pressure_education_items}
      />
      <EducationTipCard title={copy.glucose_education_title} items={copy.glucose_education_items} />
    </section>
  );
}

export function ClinicalReportGdprSection({ report }: { report: ParticipantReport }) {
  return (
    <CardShell className="bg-slate-50/70 px-4 py-3">
      <SectionHeading>{report.layout.copy.gdpr_section_title}</SectionHeading>
      <p className="mt-1.5 text-[8px] leading-relaxed text-slate-600">{report.layout.copy.gdpr_text}</p>
    </CardShell>
  );
}

export function ClinicalReportDisclaimer({ report }: { report: ParticipantReport }) {
  const { copy } = report.layout;

  return (
    <section className="rounded-xl border border-amber-200/60 bg-amber-50/30 px-4 py-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-wide text-amber-900/90">{copy.disclaimer_title}</p>
      <p className="mt-1 text-[8px] leading-relaxed text-amber-950/85">{copy.disclaimer_intro}</p>
    </section>
  );
}

export function ClinicalReportPromoBanner({ report }: { report: ParticipantReport }) {
  return (
    <section
      className="flex h-full min-h-[72px] items-center justify-center rounded-xl border border-brand-accent/40 bg-gradient-to-r from-brand-accent/10 via-white to-brand-primary/[0.04] px-4 py-2.5 text-center"
      data-testid="report-promo-banner"
    >
      <p className="text-[9px] font-semibold leading-snug text-brand-primary">
        {report.layout.copy.promo_banner_text}
      </p>
    </section>
  );
}

export function ClinicalReportSignature({
  report,
  signatureDataUrl,
  compact = false,
}: {
  report: ParticipantReport;
  signatureDataUrl?: string | null;
  compact?: boolean;
}) {
  return (
    <CardShell className={compact ? 'px-3 py-2' : 'px-4 py-3'}>
      <SectionHeading className={compact ? 'text-[8px]' : undefined}>
        {report.layout.copy.signature_section_title}
      </SectionHeading>
      <div
        className={`mt-1.5 flex items-end justify-center rounded-lg border border-dashed border-brand-primary/15 bg-slate-50/40 ${
          compact ? 'min-h-[44px] px-2 py-1.5' : 'min-h-[64px] px-4 py-3'
        }`}
      >
        {signatureDataUrl ? (
          <img
            src={signatureDataUrl}
            alt="Semnătura participantului"
            className={compact ? 'max-h-8 w-auto object-contain' : 'max-h-14 w-auto object-contain'}
          />
        ) : (
          <span className={`text-slate-400 ${compact ? 'text-[7px]' : 'pb-0.5 text-[8px]'}`}>
            Semnătura participantului
          </span>
        )}
      </div>
    </CardShell>
  );
}

/** Compact footer row: signature (left) + promo banner (right). */
export function ClinicalReportFooterRow({
  report,
  signatureDataUrl,
}: {
  report: ParticipantReport;
  signatureDataUrl?: string | null;
}) {
  return (
    <div className="grid grid-cols-1 items-stretch gap-3 print:grid-cols-[minmax(0,0.38fr)_minmax(0,1fr)] md:grid-cols-[minmax(0,0.38fr)_minmax(0,1fr)]">
      <ClinicalReportSignature report={report} signatureDataUrl={signatureDataUrl} compact />
      <ClinicalReportPromoBanner report={report} />
    </div>
  );
}
