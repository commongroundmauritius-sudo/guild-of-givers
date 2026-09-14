import { useEffect, useState } from "react";
import {
  getConsentState,
  getStoredConsent,
  subscribeConsent,
  saveConsentPreferences,
  openConsentBanner,
  openConsentModal,
  closeConsentModal,
} from "@/lib/cookie-consent";

export function useCookieConsent() {
  const [state, setState] = useState(() => ({
    consent: null as ReturnType<typeof getStoredConsent>,
    isBannerOpen: false,
    isModalOpen: false,
  }));

  useEffect(() => {
    // Initialise from this browser context rather than inheriting modal/banner
    // state from the module-level singleton used by another mounted context.
    const stored = getStoredConsent();
    setState({
      consent: stored,
      isBannerOpen: stored === null,
      isModalOpen: false,
    });

    const syncState = () => setState({ ...getConsentState() });
    const unsubscribe = subscribeConsent(syncState);
    return unsubscribe;
  }, []);

  return {
    consent: state.consent,
    hasResponded: state.consent !== null,
    isAnalyticsAllowed: state.consent?.analytics ?? false,
    isBannerOpen: state.isBannerOpen,
    isModalOpen: state.isModalOpen,
    acceptAll: () => saveConsentPreferences(true),
    rejectOptional: () => saveConsentPreferences(false),
    updatePreferences: (analytics: boolean) => saveConsentPreferences(analytics),
    openBanner: openConsentBanner,
    openModal: openConsentModal,
    closeModal: closeConsentModal,
  };
}
