import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useCookieConsent } from "@/hooks/use-cookie-consent";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — CommonGround" },
      {
        name: "description",
        content:
          "Privacy Policy for CommonGround Mauritius explaining data collection, storage, retention, user rights under the Mauritius Data Protection Act 2017, and deletion requests.",
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

function PrivacyPolicyPage() {
  const { openBanner } = useCookieConsent();

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
                Privacy Policy
              </li>
            </ol>
          </nav>

          <span className="kicker">Data Protection & Privacy</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Effective Date: May 1, 2026 | Last Updated: September 2026
          </p>

          <div className="mt-10 space-y-10 text-foreground leading-relaxed text-sm sm:text-base">
            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-primary">1. Overview</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                CommonGround Mauritius ("CommonGround", "we", "us", or "our") is dedicated to
                protecting your personal data and ensuring full transparency regarding how your
                information is collected, processed, and retained. We operate in strict compliance
                with the <strong>Mauritius Data Protection Act 2017 (DPA)</strong> and applicable
                anti-money laundering frameworks (FIAMLA).
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                2. Information We Collect
              </h2>
              <p className="mt-3 text-muted-foreground">
                We adhere strictly to data minimization principles and only collect personal data
                genuinely required for platform operation, legal compliance, and social contribution
                allocations:
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Account & Membership Data:</strong> Full Name, Email Address, Hashed
                  Password, and optional Phone Number (if provided).
                </li>
                <li>
                  <strong>Financial & Billing Data:</strong> Transaction amount, recurring cycle
                  preference, and Peach Payments transaction reference codes.{" "}
                  <em>CommonGround never sees or stores full credit card numbers or CVV codes.</em>
                </li>
                <li>
                  <strong>Partner & Organization Data:</strong> Organization Name, Registration
                  Number (Registrar of Associations), Contact Email, and Vetting Application
                  details.
                </li>
                <li>
                  <strong>Technical & Usage Data:</strong> Session state, essential authentication
                  cookies, and section analytics (only when explicit consent is provided).
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                3. How We Use Your Data
              </h2>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  To manage your membership account and process recurring monthly contributions.
                </li>
                <li>
                  To allocate funds to verified recipient Organizations in Mauritius according to
                  your preferences.
                </li>
                <li>
                  To issue tax receipts and contribution confirmations via transactional email.
                </li>
                <li>
                  To fulfill legal obligations under the Financial Intelligence and Anti-Money
                  Laundering Act (FIAMLA).
                </li>
                <li>To aggregate non-identifiable impact metrics published on the platform.</li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                4. Third-Party Data Sharing
              </h2>
              <p className="mt-3 text-muted-foreground">
                We do not sell, rent, or trade your personal data to third parties. Data is shared
                exclusively with verified service providers necessary to operate the platform:
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Payment Processor:</strong> Peach Payments (PCI-DSS compliant) for payment
                  processing.
                </li>
                <li>
                  <strong>Database & Infrastructure:</strong> Supabase (hosted in secure European
                  data centers) for encrypted data storage.
                </li>
                <li>
                  <strong>Verified Organizations:</strong> Recipient organizations receive aggregate
                  contribution totals. Individual member names are only shared if explicit consent
                  is given for community updates.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                5. Data Retention & Deletion
              </h2>
              <p className="mt-3 text-muted-foreground">
                We retain personal data only as long as necessary to fulfill the purposes outlined
                in this policy or as required by Mauritian financial regulations:
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Active Accounts:</strong> Retained for the duration of active membership.
                </li>
                <li>
                  <strong>Financial Records:</strong> Transaction logs are retained for 7 years to
                  satisfy statutory tax and FIAMLA audit requirements.
                </li>
                <li>
                  <strong>Account Deletion:</strong> You may request account deletion or
                  anonymization at any time by contacting us. Upon request, non-financial personal
                  data will be purged within 30 days.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                6. Your Rights Under DPA 2017
              </h2>
              <p className="mt-3 text-muted-foreground">
                Under the Mauritius Data Protection Act 2017, you have the right to:
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>Request access to the personal data we hold about you.</li>
                <li>Request correction of inaccurate or incomplete data.</li>
                <li>
                  Request erasure of your personal data ("right to be forgotten"), subject to
                  statutory compliance obligations.
                </li>
                <li>Withdraw consent for optional processing or analytics at any time.</li>
              </ul>
              <div className="mt-4">
                <button
                  onClick={openBanner}
                  className="inline-flex items-center justify-center rounded-full border border-primary px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary min-h-[44px]"
                >
                  Manage Cookie Consent Preferences
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-6">
              <h2 className="font-display text-lg font-bold text-primary">
                7. Contact & Data Protection Officer
              </h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                For questions regarding this Privacy Policy, data deletion requests, or to exercise
                your rights under the Data Protection Act, please contact our privacy desk:
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
