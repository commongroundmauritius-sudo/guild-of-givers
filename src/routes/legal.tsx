import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal — CommonGround" },
      { name: "description", content: "Terms of service, privacy policy and regulatory information for CommonGround Mauritius." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <SiteLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="kicker text-primary/60">Governance & Compliance</span>
          <h1 className="mt-4 font-display text-5xl font-semibold text-primary">Legal Framework</h1>

          <div className="mt-12 space-y-12 text-muted-foreground">
            {/* Regulatory Context */}
            <div className="rounded-2xl bg-card p-8 border border-border/60">
              <h2 className="font-display text-2xl text-primary font-semibold">Regulatory Context</h2>
              <p className="mt-4 leading-relaxed">
                CommonGround operates as a social infrastructure platform facilitating contributions to
                vetted Non-Governmental Organizations (NGOs) in Mauritius. All partner organizations
                must be duly registered with the <strong>Registrar of Associations</strong> and maintain
                compliance with the <strong>Financial Intelligence and Anti-Money Laundering Act (FIAMLA)</strong>.
              </p>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              {/* Terms of Service */}
              <div>
                <h2 className="font-display text-xl text-primary font-semibold border-b border-border/60 pb-2">Terms of Service</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed">
                  <p>
                    <strong>1. Membership:</strong> By creating an account and selecting a contribution plan,
                    you enter into a recurring support agreement. This is not a contract of investment but
                    a commitment to social contribution.
                  </p>
                  <p>
                    <strong>2. Allocations:</strong> While CommonGround facilitates member choice, the
                    platform reserves the right to reallocate funds to the "Impact Pool" in cases where
                    an NGO is suspended or a project is completed, ensuring your contribution always
                    reaches a verified social need.
                  </p>
                  <p>
                    <strong>3. Cancellations:</strong> Memberships can be paused or cancelled at any time
                    via the member dashboard. Contributions already processed are non-refundable as
                    they are immediately allocated to active social programs.
                  </p>
                </div>
              </div>

              {/* Privacy Policy */}
              <div>
                <h2 className="font-display text-xl text-primary font-semibold border-b border-border/60 pb-2">Privacy & Data</h2>
                <div className="mt-4 space-y-4 text-sm leading-relaxed">
                  <p>
                    <strong>Data Protection:</strong> We comply with the <strong>Mauritius Data Protection Act 2017</strong>.
                    Personal data is used strictly for authentication, receipt generation, and
                    regulatory reporting.
                  </p>
                  <p>
                    <strong>Financial Security:</strong> CommonGround does not store full credit card details.
                    All transactions are processed by <strong>Peach Payments</strong>, a PCI-DSS compliant
                    provider.
                  </p>
                  <p>
                    <strong>Transparency:</strong> Aggregate impact data (non-personally identifiable)
                    is shared with NGOs and the public to ensure ecosystem accountability.
                  </p>
                </div>
              </div>
            </div>

            {/* Liability */}
            <div>
              <h2 className="font-display text-xl text-primary font-semibold">Limitation of Liability</h2>
              <p className="mt-4 text-sm leading-relaxed">
                CommonGround acts as a facilitator and platform provider. While we conduct rigorous vetting,
                direct responsibility for the execution of social programs lies with the recipient NGOs.
                CommonGround is not liable for operational failures of partner organizations but monitors
                reporting strictly to maintain platform trust.
              </p>
            </div>

            {/* Contact */}
            <div className="border-t border-border/60 pt-8">
              <p className="text-sm">
                For formal legal inquiries or to request our full governance manual, please contact:
                <span className="ml-1 text-primary font-medium">legal@commonground.mu</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
