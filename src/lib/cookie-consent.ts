export type CookieConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
};

const CONSENT_STORAGE_KEY = "cg_cookie_consent_v1";
const CONSENT_EVENT = "commonground:cookie-consent";

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
      timestamp: typeof parsed.timestamp === "string" ? parsed.timestamp : new Date(0).toISOString(),
    };
  } catch {
    return null;
  }
}

let listeners: Array<() => void> = [];

let globalState = {
  consent: null as CookieConsentPreferences | null,
  isBannerOpen: true,
  isModalOpen: false,
};

function notify() {
  listeners.forEach((listener) => listener());
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function subscribeConsent(listener: () => void) {
  listeners.push(listener);

  if (typeof window !== "undefined") {
    const handleStorage = () => listener();
    const handleConsentEvent = () => listener();
    window.addEventListener("storage", handleStorage);
    window.addEventListener(CONSENT_EVENT, handleConsentEvent);
    return () => {
      listeners = listeners.filter((item) => item !== listener);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(CONSENT_EVENT, handleConsentEvent);
    };
  }

  return () => {
    listeners = listeners.filter((item) => item !== listener);
  };
}

export function getConsentState() {
  const stored = getStoredConsent();

  if (typeof window !== "undefined") {
    globalState = {
      consent: stored,
      isBannerOpen: stored === null,
      isModalOpen: globalState.isModalOpen,
    };
  }

  return globalState;
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

  globalState = {
    consent: preferences,
    isBannerOpen: false,
    isModalOpen: false,
  };
  notify();

  return preferences;
}

export function openConsentBanner() {
  globalState = {
    ...globalState,
    consent: getStoredConsent(),
    isBannerOpen: true,
  };
  notify();
}

export function openConsentModal() {
  globalState = {
    ...globalState,
    consent: getStoredConsent(),
    isBannerOpen: false,
    isModalOpen: true,
  };
  notify();
}

export function closeConsentModal() {
  globalState = {
    ...globalState,
    isModalOpen: false,
  };
  notify();
}

export function isAnalyticsAllowed(): boolean {
  return getStoredConsent()?.analytics ?? false;
}
