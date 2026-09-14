export type CookieConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
};

const CONSENT_STORAGE_KEY = "cg_cookie_consent_v1";
const CONSENT_EVENT = "commonground:cookie-consent";

type ConsentEventAction = "save" | "open-banner" | "open-modal" | "close-modal";

function dispatchConsentEvent(action: ConsentEventAction) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: { action } }));
}

export function getStoredConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!item) return null;
    const parsed = JSON.parse(item) as Partial<CookieConsentPreferences>;
    if (parsed.necessary !== true || typeof parsed.analytics !== "boolean") return null;
    return {
      necessary: true,
      analytics: parsed.analytics,
      timestamp:
        typeof parsed.timestamp === "string" ? parsed.timestamp : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

export function subscribeConsent(listener: (action?: ConsentEventAction) => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleStorage = () => listener("save");
  const handleConsentEvent = (event: Event) => {
    const action = (event as CustomEvent<{ action?: ConsentEventAction }>).detail?.action;
    listener(action);
  };

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CONSENT_EVENT, handleConsentEvent);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CONSENT_EVENT, handleConsentEvent);
  };
}

export function saveConsentPreferences(analytics: boolean): CookieConsentPreferences {
  const preferences: CookieConsentPreferences = {
    necessary: true,
    analytics,
    timestamp: new Date().toISOString(),
  };

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error("Failed to save cookie consent preferences", error);
    }
  }

  dispatchConsentEvent("save");
  return preferences;
}

export function openConsentBanner() {
  dispatchConsentEvent("open-banner");
}

export function openConsentModal() {
  dispatchConsentEvent("open-modal");
}

export function closeConsentModal() {
  dispatchConsentEvent("close-modal");
}

export function isAnalyticsAllowed(): boolean {
  return getStoredConsent()?.analytics ?? false;
}
