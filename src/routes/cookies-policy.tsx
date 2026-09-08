import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

export const Route = createFileRoute("/cookies-policy")({
  head: () => ({
    meta: [
      { title: "Cookies Policy — CommonGround" },
      {
        name: "description",
        content:
          "Explanation of necessary session cookies and opt-in analytics cookies used on CommonGround Mauritius, including consent management.",
      },
    ],
  }),
  component: CookiesPolicyPage,
});

function CookiesPolicyPage() {
  const { openBanner, consent } = useCookieConsent();

  return (
    <SiteLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center space-x-2 text-xs text-muted-foreground">
              <li>
                <Link to="/legal" className="hover:text-primary">
                  Legal
                </Link>
              </li>
              <li>/</li>
              <li className="font-semibold text-foreground" aria-current="page">
                Cookies Policy
              </li>
            </ol>
          </nav>

          <span className="kicker">Transparency & Control</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
            Cookies Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Effective Date: May 1, 2026 | Last Updated: September 2026
          </p>

          <div className="mt-10 space-y-10 text-foreground leading-relaxed text-sm sm:text-base">
            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-primary">1. What Are Cookies?</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                Cookies and browser local storage mechanisms are small data files placed on your
                computer or mobile device when you visit a website. They allow the website to
                recognize your session, keep you logged in securely, and understand platform usage.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                2. Cookie Categories We Use
              </h2>

              <div className="mt-6 space-y-6">
                {/* Category 1 */}
                <div className="rounded-2xl border border-border/60 bg-card p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-foreground">
                      Category 1: Essential Cookies (Strictly Necessary)
                    </h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      Always Active
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    Essential cookies are strictly necessary for the platform to function. They
                    handle authentication session tokens, CSRF defense, and navigation routing.
                  </p>
                  <table className="mt-4 w-full text-left text-xs text-muted-foreground">
                    <thead>
                      <tr className="border-b border-border text-foreground">
                        <th className="py-2">Name / Storage Key</th>
                        <th className="py-2">Purpose</th>
                        <th className="py-2">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-border/40">
                        <td className="py-2 font-mono text-[11px]">sb-*-auth-token</td>
                        <td className="py-2">Supabase JWT session authentication</td>
                        <td className="py-2">Session / 7 Days</td>
                      </tr>
                      <tr>
                        <td className="py-2 font-mono text-[11px]">cg_cookie_consent_v1</td>
                        <td className="py-2">Stores your cookie consent choices</td>
                        <td className="py-2">1 Year</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Category 2 */}
                <div className="rounded-2xl border border-border/60 bg-card p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-base text-foreground">
                      Category 2: Analytics & Performance Cookies
                    </h3>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-600">
                      Opt-in Required
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                    These internal analytics events allow us to measure section interaction and
                    feature usage.{" "}
                    <strong>
                      No analytics data is collected or sent until you explicitly grant consent.
                    </strong>{" "}
                    No third-party ad networks or cross-site tracking pixels are loaded.
                  </p>
                  <table className="mt-4 w-full text-left text-xs text-muted-foreground">
                    <thead>
                      <tr className="border-b border-border text-foreground">
                        <th className="py-2">Name / Mechanism</th>
                        <th className="py-2">Purpose</th>
                        <th className="py-2">Provider</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-2 font-mono text-[11px]">homepage_analytics</td>
                        <td className="py-2">Internal section impression & click counter</td>
                        <td className="py-2">CommonGround First-Party</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                3. Third-Party Cookies & Scripts Audit
              </h2>
              <p className="mt-3 text-muted-foreground">
                CommonGround strictly avoids unnecessary third-party trackers.
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>No Meta/Facebook Pixels:</strong> We do not deploy Meta/Facebook tracking
                  pixels.
                </li>
                <li>
                  <strong>No Google Analytics or Tag Manager:</strong> We do not load Google
                  tracking scripts or GTM containers.
                </li>
                <li>
                  <strong>No Session Recording:</strong> We do not execute invasive session
                  recording or heatmapping software (such as Hotjar or Clarity).
                </li>
                <li>
                  <strong>Payment Gateway:</strong> Payment checkout uses secure, PCI-DSS compliant
                  direct redirects or embedded iframe containers directly served by Peach Payments.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                4. Managing & Withdrawing Your Consent
              </h2>
              <p className="mt-3 text-muted-foreground">
                You can change or revoke your cookie consent preferences at any time. Clicking the
                button below opens your preference center instantly.
              </p>
              <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-primary">Your Current Status:</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Essential Cookies:{" "}
                    <span className="font-semibold text-emerald-600">Active</span> | Optional
                    Analytics Cookies:{" "}
                    <span
                      className={`font-semibold ${consent?.analytics ? "text-emerald-600" : "text-amber-600"}`}
                    >
                      {consent?.analytics ? "Enabled (Opted In)" : "Disabled (Default)"}
                    </span>
                  </p>
                </div>
                <button
                  onClick={openBanner}
                  className="min-h-[44px] inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-xs font-bold text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-colors"
                >
                  Change Cookie Preferences
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-6">
              <h2 className="font-display text-lg font-bold text-primary">5. Contact Us</h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                If you have questions regarding our cookie practices, please email:
                <br />
                <span className="font-semibold text-primary">privacy@commonground.mu</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
