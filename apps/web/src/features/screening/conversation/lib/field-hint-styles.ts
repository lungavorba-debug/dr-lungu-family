import type { AiFieldHint } from '../types/providers';

export function fieldHintClass(hint?: AiFieldHint): string {
  if (!hint?.aiFilled) {
    return '';
  }
  if (hint.confirmed === true) {
    return 'ring-2 ring-emerald-300 border-emerald-300';
  }
  if (hint.confirmed === false) {
    return '';
  }
  if (hint.lowConfidence) {
    return 'ring-2 ring-amber-400 border-amber-300 bg-amber-50/40';
  }
  if (hint.mediumConfidence) {
    return 'ring-2 ring-amber-300 border-amber-200 bg-amber-50/30';
  }
  return 'ring-2 ring-brand-accent/40 border-brand-accent/30 bg-brand-accent/5';
}

export function fieldHintBadge(hint?: AiFieldHint): string | null {
  if (!hint?.aiFilled || hint.confirmed === false) {
    return null;
  }
  if (hint.confirmed === true) {
    return 'Confirmat';
  }
  if (hint.lowConfidence) {
    return 'AI · încredere scăzută';
  }
  if (hint.mediumConfidence) {
    return 'AI · verificați';
  }
  return 'Completat AI';
}
