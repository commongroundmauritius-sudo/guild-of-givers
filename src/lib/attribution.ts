/**
 * Attribution system utilities for tracking source initiatives
 */

const STORAGE_KEY = "source_initiative_id";
const EXPIRY_KEY = "attribution_expiry";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function setAttribution(initiativeId: string): void {
  if (!initiativeId || typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, initiativeId);
  localStorage.setItem(EXPIRY_KEY, (Date.now() + THIRTY_DAYS_MS).toString());
}

export function getAttribution(): string | null {
  if (typeof window === "undefined") return null;

  const initiativeId = localStorage.getItem(STORAGE_KEY);
  const expiry = localStorage.getItem(EXPIRY_KEY);

  if (!initiativeId || !expiry) return null;

  if (Date.now() > parseInt(expiry)) {
    clearAttribution();
    return null;
  }

  return initiativeId;
}

export function clearAttribution(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}
