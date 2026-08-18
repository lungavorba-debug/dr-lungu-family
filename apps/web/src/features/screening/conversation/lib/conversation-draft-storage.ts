import type { ConversationFormState } from '../types/conversation-form';

const DRAFT_STORAGE_PREFIX = 'medscreen_conversation_draft:';

export function persistConversationDraft(userId: string, form: ConversationFormState): void {
  localStorage.setItem(`${DRAFT_STORAGE_PREFIX}${userId}`, JSON.stringify(form));
}

export function loadConversationDraft(userId: string): ConversationFormState | null {
  const raw = localStorage.getItem(`${DRAFT_STORAGE_PREFIX}${userId}`);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ConversationFormState;
  } catch {
    clearConversationDraft(userId);
    return null;
  }
}

export function clearConversationDraft(userId: string): void {
  localStorage.removeItem(`${DRAFT_STORAGE_PREFIX}${userId}`);
}
