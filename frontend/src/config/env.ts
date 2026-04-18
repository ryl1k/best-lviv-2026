const fallbackApiBaseUrl = 'https://api.logisync.systems';

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallbackApiBaseUrl;

  try {
    const parsed = new URL(trimmed);
    const cleanPath = parsed.pathname.replace(/\/swagger(?:\/.*)?$/i, '').replace(/\/+$/, '');
    return `${parsed.protocol}//${parsed.host}${cleanPath}`;
  } catch {
    return trimmed.replace(/\/+$/, '');
  }
}

export const env = {
  apiBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? fallbackApiBaseUrl),
};
