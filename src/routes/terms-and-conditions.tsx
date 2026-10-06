import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — CommonGround" },
      {
        name: "description",
        content:
          "Terms of Service governing membership, platform usage, partner organizations, and fund allocation on CommonGround Mauritius.",
      },
    ],
  }),
  component: TermsAndConditionsPage,
});

function TermsAndConditionsPage() {
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
                Terms & Conditions
              </li>
            </ol>
          </nav>

          <span className="kicker">Platform Rules & Governance</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
            Terms & Conditions
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Effective Date: May 1, 2026 | Last Updated: September 2026
          </p>

          <div className="mt-10 space-y-10 text-foreground leading-relaxed text-sm sm:text-base">
            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-primary">1. Agreement to Terms</h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                By accessing or using CommonGround Mauritius ("Platform"), creating an account, or
                committing to a recurring membership payment, you agree to be bound by these
                Terms & Conditions. If you do not agree, you must discontinue using the Platform.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                2. Platform Usage & Membership
              </h2>
              <p className="mt-3 text-muted-foreground">
                CommonGround is a marketing and membership platform connecting members with verified partner organizations and their supported initiatives in Mauritius.
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Account Responsibilities:</strong> You are responsible for maintaining the
                  confidentiality of your credentials and for all activities occurring under your
                  account.
                </li>
                <li>
                  <strong>Eligibility:</strong> You must be at least 18 years of age or possess
                  legal capacity under Mauritian law to enter into binding social agreements.
                </li>
                <li>
                  <strong>Recurring Membership Payments:</strong> Selecting a membership plan initiates a recurring membership payment. Membership payments are not capital investments, equity shares, or financial instruments.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                3. Partner Organizations & Impact Allocations
              </h2>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Verification & Compliance:</strong> All partner organizations must
                  maintain active registration with the Registrar of Associations and comply with
                  FIAMLA regulations.
                </li>
                <li>
                  <strong>Allocation Choices:</strong> Members can direct funding preferences toward
                  specific initiatives. However, if an initiative is fully funded or an Organization
                  loses verified status, CommonGround reserves the right to allocate funds to the
                  general "Impact Pool" to maintain operational continuity.
                </li>
                <li>
                  <strong>Organizational Responsibility:</strong> Partner Organizations are solely
                  responsible for executing field programs as described in their published profiles
                  and reporting accurate impact metrics.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                4. Payments, Billing & Fee Coverage
              </h2>
              <p className="mt-3 text-muted-foreground">
                All financial transactions on CommonGround are processed securely in Mauritian
                Rupees (MUR) via PCI-DSS certified gateway provider <strong>Peach Payments</strong>.
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  If you choose to cover the applicable payment-processing fee, the amount charged to your card includes that fee separately from your membership amount.
                </li>
                <li>
                  Details regarding billing errors, cancellations, and exceptional refunds are
                  governed by our{" "}
                  <Link
                    to="/refund-policy"
                    className="underline text-primary hover:text-primary/80"
                  >
                    Refund Policy
                  </Link>
                  .
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                5. Prohibited Conduct & Community Guidelines
              </h2>
              <p className="mt-3 text-muted-foreground">Users and partner entities agree not to:</p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  Publish false, misleading, defamatory, or hateful content on community hubs or
                  initiative updates.
                </li>
                <li>
                  Misrepresent organizational credentials or use the Platform for money laundering
                  or unauthorized solicitation.
                </li>
                <li>
                  Attempt to compromise the security, integrity, or automated functionality of the
                  Platform.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                6. Intellectual Property & Limitation of Liability
              </h2>
              <p className="mt-3 text-muted-foreground">
                All materials, trademarks, logos, and software architecture on CommonGround are the
                property of CommonGround or its licensors. To the maximum extent permitted by law,
                CommonGround acts as a facilitator and shall not be liable for indirect or
                consequential damages arising from third-party field operations.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                7. Termination & Governance Changes
              </h2>
              <p className="mt-3 text-muted-foreground">
                We reserve the right to suspend or terminate accounts that violate these terms or
                applicable laws. CommonGround may update these terms from time to time with notice
                published on the platform.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-muted/30 p-6">
              <h2 className="font-display text-lg font-bold text-primary">
                8. Governing Law & Contact
              </h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                These terms are governed by the laws of the Republic of Mauritius. For legal
                inquiries or formal correspondence:
                <br />
                <span className="font-semibold text-primary">legal@commonground.mu</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
