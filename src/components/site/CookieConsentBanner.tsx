import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { useCookieConsent } from "@/hooks/use-cookie-consent";
import { Cookie, Settings, ShieldCheck, X } from "lucide-react";

export function CookieConsentBanner() {
  const {
    consent,
    isBannerOpen,
    isModalOpen,
    acceptAll,
    rejectOptional,
    updatePreferences,
    openModal,
    closeModal,
  } = useCookieConsent();

  const [analyticsChecked, setAnalyticsChecked] = useState(consent?.analytics ?? false);

  useEffect(() => {
    setAnalyticsChecked(consent?.analytics ?? false);
  }, [consent]);

  if (!isBannerOpen && !isModalOpen) {
    return null;
  }

  const handleSaveCustom = () => {
    updatePreferences(analyticsChecked);
    closeModal();
  };

  return (
    <>
      {/* Banner */}
      {isBannerOpen && !isModalOpen && (
        <aside
          role="region"
          aria-label="Cookie Consent Banner"
          className="fixed bottom-0 inset-x-0 z-50 p-4 sm:p-6 bg-card/95 backdrop-blur-md border-t border-border shadow-2xl"
        >
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 max-w-3xl">
              <div className="p-2.5 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                <Cookie className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">We respect your privacy</h3>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  We use essential cookies to keep CommonGround operational and secure. With your
                  consent, we also use optional analytics cookies to measure page interaction and
                  improve the platform. Non-essential cookies are disabled until you grant consent.
                  Learn more in our{" "}
                  <Link
                    to="/cookies-policy"
                    className="underline text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                  >
                    Cookies Policy
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="/privacy-policy"
                    className="underline text-primary hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/50 rounded"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
              <button
                onClick={() => {
                  setAnalyticsChecked(consent?.analytics ?? false);
                  openModal();
                }}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                <Settings className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                Customize
              </button>
              <button
                onClick={rejectOptional}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Reject Optional
              </button>
              <button
                onClick={acceptAll}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </aside>
      )}

      {/* Preferences Modal */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-lg rounded-2xl bg-card p-6 shadow-2xl border border-border space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                <h2 id="cookie-modal-title" className="text-lg font-bold text-foreground">
                  Cookie Preferences
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                aria-label="Close preferences modal"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Manage your cookie preferences. Essential cookies are required for authentication,
              security, and basic navigation, and cannot be disabled.
            </p>

            <div className="space-y-4">
              {/* Category 1: Essential */}
              <div className="rounded-xl border border-border p-4 bg-muted/30 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">Essential Cookies</span>
                    <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                      Always Active
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Necessary for user login, session management, CSRF protection, and payment
                    routing.
                  </p>
                </div>
                <input
                  type="checkbox"
                  disabled
                  checked
                  aria-label="Essential cookies (always active)"
                  className="mt-1 h-5 w-5 rounded border-muted text-primary cursor-not-allowed opacity-70"
                />
              </div>

              {/* Category 2: Analytics */}
              <div className="rounded-xl border border-border p-4 bg-card flex items-start justify-between gap-4">
                <div>
                  <span className="text-sm font-bold text-foreground">Analytics & Performance</span>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    Helps us understand section engagement and campaign effectiveness on
                    CommonGround. No third-party ad networks are used.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={analyticsChecked}
                  onClick={() => setAnalyticsChecked(!analyticsChecked)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 min-h-[44px] min-w-[44px] items-center px-0.5 ${analyticsChecked ? "bg-primary" : "bg-muted"}`}
                  aria-label="Analytics Cookies Switch"
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${analyticsChecked ? "translate-x-5" : "translate-x-0"}`}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
              <button
                onClick={closeModal}
                className="min-h-[44px] inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-xs font-semibold text-foreground hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustom}
                className="min-h-[44px] inline-flex items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
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
