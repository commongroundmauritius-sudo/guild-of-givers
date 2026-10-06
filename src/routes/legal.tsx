import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ShieldCheck, FileText, RefreshCw, Cookie, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal & Compliance Hub — CommonGround" },
      {
        name: "description",
        content:
          "Legal framework, governance guidelines, terms of service, privacy policy, refund policy, and cookies compliance for CommonGround Mauritius.",
      },
    ],
  }),
  component: LegalPage,
});

export function LegalPage() {
  return (
    <SiteLayout>
      <section className="bg-background">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <span className="kicker">Governance & Compliance</span>
          <h1 className="mt-2 font-display text-4xl font-bold text-primary sm:text-5xl">
            Legal Framework & Policies
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-2xl">
            CommonGround operates as a marketing and membership platform that helps vetted organizations in Mauritius gain visibility and recurring support. Membership payments are processed by CommonGround and funds are allocated to supported initiatives according to our published model.
          </p>

          {/* Quick Nav Cards */}
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <Link
              to="/privacy-policy"
              className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Privacy Policy
              </h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Full transparency on data collection, user rights under the Mauritius Data
                Protection Act 2017, data retention, and deletion procedures.
              </p>
            </Link>

            <Link
              to="/terms-and-conditions"
              className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-6 w-6" aria-hidden="true" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Terms & Conditions
              </h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Platform usage rules, membership terms, partner organization obligations, and liability limitations.
              </p>
            </Link>

            <Link
              to="/refund-policy"
              className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <RefreshCw className="h-6 w-6" aria-hidden="true" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Refund & Cancellation Policy
              </h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                Clear rules regarding membership billing, allocation of funds, cancellation, and exceptional 14-day billing error reviews.
              </p>
            </Link>

            <Link
              to="/cookies-policy"
              className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 rounded-xl bg-primary/10 text-primary">
                  <Cookie className="h-6 w-6" aria-hidden="true" />
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </div>
              <h2 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">
                Cookies & Browser Storage
              </h2>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                How CommonGround uses essential browser storage and payment-provider technologies. Optional analytics and advertising cookies are not used.
              </p>
            </Link>
          </div>

          {/* Regulatory Context Box */}
          <div className="mt-12 rounded-2xl border border-border/60 bg-card p-8">
            <h2 className="font-display text-2xl font-bold text-primary">
              Regulatory Context & Vetting
            </h2>
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              All partner entities onboarded to CommonGround are required to maintain active
              registration with the <strong>Registrar of Associations</strong> and comply with the{" "}
              <strong>Financial Intelligence and Anti-Money Laundering Act (FIAMLA)</strong>.
              Financial processing is facilitated via PCI-DSS certified gateway services.
            </p>
            <div className="mt-6 border-t border-border pt-4 text-xs text-muted-foreground">
              For legal inquiries or formal compliance documentation:{" "}
              <span className="font-semibold text-primary">legal@commonground.mu</span>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
