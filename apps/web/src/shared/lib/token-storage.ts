const TOKEN_KEY = 'medscreen_token';

export function getAuthToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null, persistent = true): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);

  if (!token) {
    return;
  }

  const storage = persistent ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
}
