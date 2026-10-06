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
          "Legal framework, terms, privacy, refund and cookies policies for CommonGround Mauritius.",
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
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            CommonGround operates as a marketing and membership platform that helps organizations
            in Mauritius gain visibility and recurring support. Membership payments are made to
            CommonGround and funds are allocated to supported initiatives according to the
            platform's published model.
          </p>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {[
              ["/privacy-policy","Privacy Policy","Data collection, user rights, retention and deletion procedures.",ShieldCheck],
              ["/terms-and-conditions","Terms & Conditions","Platform usage, membership terms, partner obligations and liability.",FileText],
              ["/refund-policy","Refund & Cancellation Policy","Membership billing, cancellation and exceptional billing-error reviews.",RefreshCw],
              ["/cookies-policy","Cookies & Browser Storage","Essential browser storage, authentication and payment-environment technologies.",Cookie],
            ].map(([to,title,description,Icon]) => (
              <Link key={to as string} to={to as string} className="group rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-all hover:border-primary hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary">
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-primary/10 p-3 text-primary"><Icon className="h-6 w-6" aria-hidden="true" /></div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-foreground group-hover:text-primary">{title as string}</h2>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description as string}</p>
              </Link>
            ))}
          </div>
          <div className="mt-12 rounded-2xl border border-border/60 bg-card p-8">
            <h2 className="font-display text-2xl font-bold text-primary">Partner Review & Compliance</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Partner organizations are subject to CommonGround's onboarding and review requirements.
              Applicable registration and compliance requirements are considered as part of that process.
              Payment processing is provided through payment services used by CommonGround when enabled.
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