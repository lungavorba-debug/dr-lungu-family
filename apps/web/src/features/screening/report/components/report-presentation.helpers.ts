import {
  IconBloodDrop,
  IconCalendar,
  IconClock,
  IconHeartPulse,
  IconMail,
  IconMapPin,
  IconPhone,
  IconStethoscope,
  IconUser,
  IconUsers,
  IconWalking,
} from './report-presentation-icons';

export const REPORT_PRESENTATION_ICONS = {
  user: IconUser,
  calendar: IconCalendar,
  users: IconUsers,
  phone: IconPhone,
  mapPin: IconMapPin,
  mail: IconMail,
  clock: IconClock,
  heart: IconHeartPulse,
  stethoscope: IconStethoscope,
  walking: IconWalking,
  nutrition: IconBloodDrop,
} as const;

/** Map screening answer text to badge colours (presentation only). */
export function screeningAnswerBadgeClass(answer: string): string {
  const normalized = answer.trim();
  if (normalized === 'Nu') {
    return 'bg-emerald-50 text-emerald-800 ring-emerald-200/90';
  }
  if (normalized === 'Da') {
    return 'bg-red-50 text-red-800 ring-red-200/90';
  }
  if (normalized === 'Fost fumător') {
    return 'bg-amber-50 text-amber-900 ring-amber-200/90';
  }
  if (normalized.startsWith('Da —') || normalized.startsWith('Da -')) {
    return 'bg-blue-50 text-blue-800 ring-blue-200/90';
  }
  return 'bg-slate-50 text-slate-700 ring-slate-200/90';
}

/** Pick a subtle recommendation icon from existing text/code (presentation only). */
export function pickRecommendationIcon(
  text: string,
  code?: string,
): (typeof REPORT_PRESENTATION_ICONS)[keyof typeof REPORT_PRESENTATION_ICONS] {
  const lower = text.toLowerCase();
  const codeLower = code?.toLowerCase() ?? '';

  if (
    codeLower.includes('bp') ||
    codeLower.includes('cardio') ||
    codeLower.includes('chest') ||
    lower.includes('cardiolog') ||
    lower.includes('tensiune')
  ) {
    return IconHeartPulse;
  }

  if (
    codeLower.includes('glucose') ||
    codeLower.includes('diabet') ||
    codeLower.includes('bmi') ||
    codeLower.includes('weight') ||
    lower.includes('diabet') ||
    lower.includes('greutate') ||
    lower.includes('aliment')
  ) {
    return IconBloodDrop;
  }

  if (
    codeLower.includes('smoking') ||
    codeLower.includes('walk') ||
    codeLower.includes('activity') ||
    lower.includes('activitate') ||
    lower.includes('mers') ||
    lower.includes('pauze')
  ) {
    return IconWalking;
  }

  return IconStethoscope;
}

/** Participant field label → subtle icon (presentation only). */
export function participantFieldIcon(
  label: string,
): (typeof REPORT_PRESENTATION_ICONS)[keyof typeof REPORT_PRESENTATION_ICONS] | null {
  switch (label) {
    case 'Nume':
    case 'Prenume':
      return IconUser;
    case 'Vârstă':
      return IconCalendar;
    case 'Sex':
      return IconUsers;
    case 'Telefon':
      return IconPhone;
    case 'Localitate':
      return IconMapPin;
    case 'Data screeningului':
      return IconCalendar;
    case 'Ora':
      return IconClock;
    case 'Operator':
      return IconUser;
    default:
      return null;
  }
}
