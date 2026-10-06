import { useMemberCheck } from "@/hooks/use-member-check";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ShieldCheck, Target, Users, TrendingUp, Globe, Heart, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CommonGround — Structured Philanthropy in Mauritius" },
      {
        name: "description",
        content:
          "CommonGround is a membership-based platform providing predictable, structured funding for high-impact social programs in Mauritius.",
      },
      { property: "og:title", content: "About CommonGround" },
      { property: "og:type", content: "website" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { handleMemberAction } = useMemberCheck();
  return (
    <SiteLayout>
      <div className="bg-background min-h-screen">
        {/* Hero */}
        <section className="relative overflow-hidden bg-primary/5 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="rounded-full bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                Our Story
              </span>
              <h1 className="mt-8 font-display text-5xl font-bold tracking-tight text-primary sm:text-7xl">
                Systemic Change, <br />
                <span className="text-primary/40 italic">built for lasting impact.</span>
              </h1>
              <p className="mt-8 text-xl leading-relaxed text-muted-foreground">
                CommonGround was built to solve the "funding gap" for non-profits. We replace
                erratic, one-off donations with predictable, monthly memberships that allow
                organizations to focus on long-term impact rather than fundraising.
              </p>
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-3">
              <div className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/10 text-forest">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary">Deep Vetting</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Every organization on our platform undergoes a rigorous assessment of their
                  governance, financial transparency, and proven track record of impact.
                </p>
              </div>
              <div className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary">
                  Predictable Funding
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  By structuring support as monthly memberships, we provide organizations with the
                  stability they need to commit to multi-year restoration and education programs.
                </p>
              </div>
              <div className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary">Root Cause Focus</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We prioritize initiatives that solve systemic problems at their source, aiming for
                  permanent solutions rather than temporary relief.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-4xl font-bold text-primary">
              Ready to make an impact?
            </h2>
            <p className="mt-6 text-lg text-muted-foreground">
              Join a growing community of members dedicated to building a resilient future for
              Mauritius.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                onClick={handleMemberAction}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 font-bold text-white shadow-xl shadow-primary/20 transition hover:bg-primary/90"
              >
                Become a Member <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/initiatives"
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-8 py-4 font-bold text-primary transition hover:bg-muted"
              >
                Explore Initiatives
              </Link>
            </div>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
