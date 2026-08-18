/** Shared browser storage for screening workflow — survives refresh and tab restore. */

export function readWorkflowStorageItem(key: string): string | null {
  const fromLocal = localStorage.getItem(key);
  if (fromLocal) {
    return fromLocal;
  }

  const fromSession = sessionStorage.getItem(key);
  if (fromSession) {
    localStorage.setItem(key, fromSession);
    sessionStorage.removeItem(key);
  }

  return fromSession;
}

export function writeWorkflowStorageItem(key: string, value: string): void {
  localStorage.setItem(key, value);
}

export function removeWorkflowStorageItem(key: string): void {
  localStorage.removeItem(key);
  sessionStorage.removeItem(key);
}
