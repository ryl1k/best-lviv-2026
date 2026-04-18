import type { User } from '@/api/models';

const ACCESS_TOKEN_KEY = 'revela.auth.access_token';
const USER_KEY = 'revela.auth.user';

function canUseLocalStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getAccessToken(): string | null {
  if (!canUseLocalStorage()) return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function getStoredUser(): User | null {
  if (!canUseLocalStorage()) return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as User;
  } catch {
    window.localStorage.removeItem(USER_KEY);
    return null;
  }
}

export function setStoredUser(user: User): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearStoredUser(): void {
  if (!canUseLocalStorage()) return;
  window.localStorage.removeItem(USER_KEY);
}

export function clearAuthStorage(): void {
  clearAccessToken();
  clearStoredUser();
}

