import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { Cookie, Settings, ShieldCheck, X } from "lucide-react";

export function CookieConsentBanner() {
  const {
    consent,
    isHydrated,
    isBannerOpen,
    isModalOpen,
    acceptAll,
    rejectOptional,
    updatePreferences,
    openModal,
    closeModal,
  } = useCookieConsent();

  const [analyticsChecked, setAnalyticsChecked] = useState(false);
  const currentAnalytics = consent?.analytics ?? false;

  useEffect(() => {
    setAnalyticsChecked(consent?.analytics ?? false);
  }, [consent]);

  // Render the banner during SSR/pre-hydration so the consent control is present
  // immediately. Once hydration completes, React becomes authoritative and removes
  // it when stored consent exists.
  const shouldShowBanner =
    !isHydrated || (isBannerOpen && consent === null && !isModalOpen);

  const handleSaveCustom = () => {
    updatePreferences(analyticsChecked);
    closeModal();
  };

  return (
    <>
      {shouldShowBanner && (
        <aside
          role="region"
          aria-label="Cookie Consent Banner"
          className="cg-consent-banner fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 p-4 shadow-2xl backdrop-blur-md sm:p-6"
        >
          <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div className="flex max-w-3xl items-start gap-3.5">
              <div className="mt-0.5 shrink-0 rounded-full bg-primary/10 p-2.5 text-primary">
                <Cookie className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">We respect your privacy</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  We use essential cookies to keep CommonGround operational and secure. With your
                  consent, we also use optional analytics cookies to measure page interaction and
                  improve the platform. Non-essential cookies are disabled until you grant consent.
                  Learn more in our{" "}
                  <Link
                    to="/cookies-policy"
                    className="rounded underline text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    Cookies Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy"
                    className="rounded underline text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
            <div className="flex w-full shrink-0 flex-wrap items-center justify-end gap-2.5 md:w-auto">
              <button
                data-cg-consent="open-modal"
                onClick={() => {
                  setAnalyticsChecked(currentAnalytics);
                  openModal();
                }}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                <Settings className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Customize
              </button>
              <button
                data-cg-consent="reject"
                onClick={rejectOptional}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Reject Optional
              </button>
              <button
                data-cg-consent="accept"
                onClick={acceptAll}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
        >
          <div className="relative w-full max-w-lg space-y-6 rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 id="cookie-modal-title" className="text-lg font-bold text-foreground">
                  Cookie Preferences
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close preferences modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Manage your cookie preferences. Essential cookies are required for authentication,
              security, and basic navigation, and cannot be disabled.
            </p>
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-muted/30 p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Essential Cookies</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      Always Active
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Necessary for user login, session management, CSRF protection, and payment
                    routing.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked
                  aria-label="Essential cookies (always active)"
                  className="mt-1 h-5 w-5 cursor-not-allowed rounded border-muted text-primary opacity-70"
                />
              </div>
              <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
                <div>
                  <span className="text-sm font-bold text-foreground">Analytics & Performance</span>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    Helps us understand section engagement and campaign effectiveness on
                    CommonGround. No third-party ad networks are used.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsChecked}
                  onClick={() => setAnalyticsChecked(!analyticsChecked)}
                  className={`relative inline-flex h-6 w-11 min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent px-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${analyticsChecked ? "bg-primary" : "bg-muted"}`}
                  aria-label="Analytics Cookies Switch"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${analyticsChecked ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                onClick={closeModal}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
