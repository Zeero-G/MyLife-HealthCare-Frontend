/** Shareable emergency access link (hash route handled by App). */
export function buildEmergencyAccessUrl(token: string): string {
  const base = `${window.location.origin}${window.location.pathname}`;
  return `${base}#/emergency-access/${encodeURIComponent(token)}`;
}

export function parseEmergencyAccessTokenFromHash(): string | null {
  const match = window.location.hash.match(/^#\/emergency-access\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}
