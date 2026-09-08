import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: "Refund & Cancellation Policy — CommonGround" },
      {
        name: "description",
        content:
          "Refund and cancellation terms for recurring memberships and contributions on CommonGround Mauritius.",
      },
    ],
  }),
  component: RefundPolicyPage,
});

function RefundPolicyPage() {
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
                Refund Policy
              </li>
            </ol>
          </nav>

          <span className="kicker">Financial Transparency</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
            Refund & Cancellation Policy
          </h1>
          <p className="mt-4 text-sm text-muted-foreground">
            Effective Date: May 1, 2026 | Last Updated: September 2026
          </p>

          <div className="mt-10 space-y-10 text-foreground leading-relaxed text-sm sm:text-base">
            <div className="rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
              <h2 className="font-display text-xl font-bold text-primary">
                1. Nature of Social Contributions
              </h2>
              <p className="mt-3 leading-relaxed text-muted-foreground">
                CommonGround operates as a social infrastructure platform facilitating recurring
                monthly contributions to verified Non-Governmental Organizations (Organizations) in
                Mauritius. Contributions are immediately allocated to active social initiatives,
                environmental programs, and community projects.
              </p>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                2. Membership Cancellations
              </h2>
              <p className="mt-3 text-muted-foreground">
                You maintain complete control over your recurring membership and can pause or cancel
                at any time:
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Cancellation via Dashboard:</strong> You can cancel your monthly
                  membership directly from your account dashboard under Settings/Membership with a
                  single click.
                </li>
                <li>
                  <strong>Immediate Effect for Future Cycles:</strong> Cancellation takes effect
                  immediately for all future billing cycles. No further charges will be processed
                  once cancelled.
                </li>
                <li>
                  <strong>No Fee for Cancellation:</strong> There are no penalty fees, lock-in
                  periods, or hidden charges for cancelling your membership.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                3. General Refund Policy
              </h2>
              <p className="mt-3 text-muted-foreground">
                Because recurring contributions are immediately pooled and disbursed to recipient
                Organizations to fund active field operations:
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Completed Allocations:</strong> Contributions that have already been
                  processed and allocated toward verified programs are generally non-refundable.
                </li>
                <li>
                  <strong>Statutory Rights Reserved:</strong> Nothing in this policy restricts or
                  overrides mandatory consumer protection rights or statutory remedies provided
                  under Mauritian law.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                4. Exceptional Cases & Billing Errors
              </h2>
              <p className="mt-3 text-muted-foreground">
                We understand that mistakes happen. CommonGround evaluates refund requests on a
                case-by-case basis for exceptional circumstances:
              </p>
              <ul className="mt-4 list-disc pl-6 space-y-2 text-muted-foreground">
                <li>
                  <strong>Accidental Duplicate Charges:</strong> If you are accidentally billed
                  multiple times for the same monthly cycle due to a gateway technical error, full
                  refunds for duplicate amounts will be processed promptly.
                </li>
                <li>
                  <strong>Unauthorized Transactions:</strong> If an unauthorized party accesses your
                  payment card details, please notify us and your financial institution immediately.
                </li>
                <li>
                  <strong>Evaluation Window:</strong> Billing error refund requests must be
                  submitted to our support team within <strong>14 calendar days</strong> of the
                  transaction date.
                </li>
              </ul>
            </div>

            <div>
              <h2 className="font-display text-xl font-bold text-primary border-b border-border/60 pb-2">
                5. How to Request a Refund or Support
              </h2>
              <p className="mt-3 text-muted-foreground">
                To request a review of a transaction or report a billing issue:
              </p>
              <ol className="mt-4 list-decimal pl-6 space-y-2 text-muted-foreground">
                <li>
                  Email our support desk at{" "}
                  <span className="font-semibold text-primary">support@commonground.mu</span> or{" "}
                  <span className="font-semibold text-primary">finance@commonground.mu</span>.
                </li>
                <li>
                  Include your account email address, transaction date, and payment reference code.
                </li>
                <li>Provide a brief explanation of the issue or accidental charge.</li>
              </ol>
              <p className="mt-4 text-xs text-muted-foreground">
                Refunds approved for exceptional cases will be credited back to the original payment
                method processed via Peach Payments within 5 to 10 business days.
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
