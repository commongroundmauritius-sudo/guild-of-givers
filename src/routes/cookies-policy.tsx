import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/cookies-policy")({
  head: () => ({
    meta: [
      { title: "Cookies & Browser Storage — CommonGround" },
      {
        name: "description",
        content:
          "CommonGround's notice explaining essential browser storage, authentication, payment-provider technologies, and the absence of optional analytics cookies.",
      },
    ],
  }),
  component: CookiesPolicyPage,
});

function CookiesPolicyPage() {
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

          <span className="kicker">Transparency</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
            Cookies & Browser Storage
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Effective Date: May 1, 2026 | Last Updated: September 2026
          </p>

          <div className="mt-10 space-y-10 text-foreground leading-relaxed text-sm sm:text-base">
            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-primary">1. What We Use</h2>
              <p className="mt-3 text-muted-foreground">
                CommonGround uses only the browser storage and cookies that are necessary to provide,
                secure, and maintain the service. We do not use an optional analytics cookie category,
                advertising pixels, or cross-site tracking cookies on the CommonGround website.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                2. Essential Browser Storage
              </h2>
              <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Authentication and session state may be stored by Supabase in browser storage so
                  that members can securely remain signed in. These mechanisms are required for
                  account access and protected platform features and are not used for advertising.
                </p>
                <table className="mt-4 w-full text-left text-xs text-muted-foreground">
                  <thead>
                    <tr className="border-b border-border text-foreground">
                      <th className="py-2">Storage / Technology</th>
                      <th className="py-2">Purpose</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-2 font-mono text-[11px]">sb-*-auth-token</td>
                      <td className="py-2">Supabase authentication and session state</td>
                    </tr>
                    <tr>
                      <td className="py-2">Payment-provider technologies</td>
                      <td className="py-2">Secure payment checkout, fraud prevention, and payment processing</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                3. Analytics & Tracking
              </h2>
              <p className="mt-3 text-muted-foreground">
                CommonGround does not load Google Analytics, Google Tag Manager, Meta/Facebook
                Pixel, session-recording software, advertising pixels, or optional analytics
                cookies. The previous optional consent mechanism has been removed from the website.
              </p>
              <p className="mt-3 text-muted-foreground">
                CommonGround may maintain server-side operational records needed to operate the
                platform, measure service performance, prevent abuse, or maintain application
                functionality. These records are not optional browser analytics cookies.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                4. Third-Party Payment Technologies
              </h2>
              <p className="mt-3 text-muted-foreground">
                When you use payment checkout, Peach Payments may use cookies or similar technologies
                within its payment environment for security, fraud prevention, session continuity,
                and payment processing. Those technologies are controlled by the payment provider
                and are subject to its own notices and policies.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                5. Privacy & Data Protection
              </h2>
              <p className="mt-3 text-muted-foreground">
                Removing the optional consent interface does not remove CommonGround's data
                protection responsibilities. Personal data is still handled according to our Privacy
                Policy and the applicable Mauritius Data Protection Act requirements. We aim to
                collect only data that is adequate, relevant, and necessary for stated purposes.
              </p>
              <p className="mt-3 text-muted-foreground">
                For more information about your rights, processing purposes, retention, and how to
                contact CommonGround, please see our <Link to="/privacy-policy" className="text-primary underline">Privacy Policy</Link>.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-6">
              <h2 className="font-display text-lg font-bold text-primary">6. Contact Us</h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Questions about browser storage or privacy can be sent to:
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
