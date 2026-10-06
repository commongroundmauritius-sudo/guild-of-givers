import { useMemberCheck } from "@/hooks/use-member-check";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { ShieldCheck, Target, TrendingUp, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About CommonGround — Structured Impact in Mauritius" },
      {
        name: "description",
        content:
          "CommonGround is a membership-based marketing platform helping organizations in Mauritius gain visibility and recurring support.",
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
                CommonGround was built to help close the funding gap for organizations doing
                meaningful work in Mauritius. We connect organizations with members who provide
                predictable, recurring support so organizations can focus on long-term impact.
              </p>
            </div>
          </div>
        </section>

        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-16 lg:grid-cols-3">
              <div className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-forest/10 text-forest">
                  <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary">Partner Review</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We review partner organizations against our onboarding requirements, including
                  organizational information, registration details and the information needed to
                  assess their initiatives.
                </p>
              </div>
              <div className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600">
                  <TrendingUp className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary">Predictable Funding</h3>
                <p className="text-muted-foreground leading-relaxed">
                  By structuring support as monthly memberships, we give organizations a more
                  predictable funding model for programs that take time to deliver.
                </p>
              </div>
              <div className="space-y-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Target className="h-6 w-6" aria-hidden="true" />
                </div>
                <h3 className="font-display text-2xl font-bold text-primary">Long-Term Focus</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We prioritize initiatives designed to create meaningful, lasting outcomes rather
                  than focusing only on short-term activity.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 py-24 sm:py-32">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <h2 className="font-display text-4xl font-bold text-primary">Ready to make an impact?</h2>
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
                Become a Member <ArrowRight className="h-5 w-5" aria-hidden="true" />
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