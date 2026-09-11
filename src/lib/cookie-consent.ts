export type CookieConsentPreferences = {
  necessary: boolean;
  analytics: boolean;
  timestamp: string;
};

const CONSENT_STORAGE_KEY = "cg_cookie_consent_v1";

export function getStoredConsent(): CookieConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const item = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!item) return null;
    return JSON.parse(item) as CookieConsentPreferences;
  } catch (e) {
    return null;
  }
}

let listeners: Array<() => void> = [];

let globalState = {
  consent: typeof window !== "undefined" ? getStoredConsent() : null,
  isBannerOpen: typeof window !== "undefined" ? getStoredConsent() === null : false,
  isModalOpen: false,
};

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeConsent(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getConsentState() {
  if (typeof window !== "undefined") {
    const stored = getStoredConsent();

    // Reconcile the in-memory singleton with browser storage on every read.
    // This prevents SSR/hydration module state from suppressing the initial
    // banner when the visitor has not yet made a choice.
    if (stored) {
      globalState = {
        consent: stored,
        isBannerOpen: false,
        isModalOpen: globalState.isModalOpen,
      };
    } else if (!globalState.consent && !globalState.isModalOpen) {
      globalState = {
        ...globalState,
        consent: null,
        isBannerOpen: true,
      };
    }
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
    } catch (e) {
      console.error("Failed to save cookie consent preferences", e);
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
    isBannerOpen: true,
  };
  notify();
}

export function openConsentModal() {
  globalState = {
    ...globalState,
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
  const consent = getStoredConsent();
  return consent ? consent.analytics : false;
}
