import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import heroRoom from "@/assets/hero-room.jpg";
import orgsBoardroom from "@/assets/orgs-boardroom.jpg";
import { UserPlus, BookOpen, Split, LineChart, Sparkles, Eye, Target, Repeat } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getJoinedField } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CommonGround — One Membership. Long-term Impact." },
      {
        name: "description",
        content:
          "Turn one monthly membership into predictable funding for vetted, long-term social impact programs.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const queryKeys = useMemo(() => [["homepage-initiatives"]], []);
  useRealtimeSync("initiatives", queryKeys);
  return (
    <SiteLayout>
      <Hero />
      <Process />
      <Why />
      <Initiatives />
      <ForOrgs />
      <FAQ />
      <FinalCTA />
    </SiteLayout>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <span className="kicker block text-muted-foreground">{children}</span>;
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-28">
        <div className="flex flex-col justify-center">
          <Kicker>Impact, simplified</Kicker>
          <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.1] text-primary sm:text-7xl">
            One membership. <br />
            <span className="text-teal-600">Long-term impact.</span>
          </h1>
          <p className="mt-8 max-w-lg text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Join the Guild of Givers. We turn monthly contributions into predictable funding for
            Mauritius' most effective social initiatives.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/initiatives/$slug"
              params={{ slug: i.slug }}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              Become a Member
            </Link>
            <Link
              to="/initiatives"
              className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-background px-8 py-4 text-sm font-semibold text-primary transition hover:bg-muted"
            >
              Explore Initiatives
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[4/5] overflow-hidden rounded-[3rem] border border-border/60 bg-muted sm:aspect-square lg:aspect-[4/5]">
            <img
              src={heroRoom}
              alt="Community impact"
              width={1280}
              height={1600}
              loading="eager"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 -left-6 rounded-3xl border border-border/40 bg-background p-6 shadow-xl sm:p-8">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-background bg-teal-100"
                  />
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-primary">Join 240+ members</p>
                <p className="text-xs text-muted-foreground">Growing every day</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    n: "01",
    icon: UserPlus,
    title: "Join",
    desc: "Pick a monthly contribution amount that fits your budget.",
  },
  {
    n: "02",
    icon: BookOpen,
    title: "Choose",
    desc: "Browse through our library of vetted, high-impact social initiatives.",
  },
  {
    n: "03",
    icon: Split,
    title: "Allocate",
    desc: "Decide how your contribution is split between your selected organizations.",
  },
  {
    n: "04",
    icon: LineChart,
    title: "Track",
    desc: "Receive unified impact reports detailing exactly how your money is used.",
  },
];

function Process() {
  return (
    <section className="border-t border-border/60 bg-card">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <Kicker>Process</Kicker>
          <h2 className="mt-4 font-display text-4xl font-semibold text-primary sm:text-5xl">
            How It Works
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="group relative rounded-3xl border border-border/60 bg-background p-7 transition hover:border-primary/30 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cream-deep">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-6 font-display text-xs font-medium tracking-widest text-muted-foreground">
                {s.n}
              </div>
              <h3 className="mt-1 font-display text-2xl font-semibold text-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const REASONS = [
  {
    icon: Sparkles,
    title: "Simplicity",
    desc: "Managing multiple donations is complex. We consolidate everything into one clean dashboard with a single monthly transaction.",
  },
  {
    icon: Eye,
    title: "Transparency",
    desc: "Every dollar is tracked. We provide audited reports and direct updates from the field.",
  },
  {
    icon: Target,
    title: "Real Impact",
    desc: "We focus on vetted, results-driven initiatives that solve systemic problems at the root.",
  },
  {
    icon: Repeat,
    title: "Consistency",
    desc: "Non-profits need predictable funding to grow. CommonGround ensures steady support through recurring monthly memberships.",
  },
];

function Why() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <Kicker>Why CommonGround</Kicker>
          <h2 className="mt-4 font-display text-4xl font-semibold text-primary sm:text-5xl">
            Built for trust, transparency and the long-haul.
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {REASONS.map((r) => (
            <div key={r.title} className="rounded-3xl bg-card p-8 border border-border/40">
              <r.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-5 font-display text-2xl font-semibold text-primary">{r.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Initiatives() {
  const queryKeys = useMemo(() => [["homepage-initiatives"]], []);
  useRealtimeSync("initiatives", queryKeys);

  const {
    data: initiatives,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["homepage-initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*, organizations!inner(organization_name, status)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .eq("organizations.status", "active")
        .limit(3);

      if (error) throw error;
      return data;
    },
  });

  return (
    <section id="initiatives" className="border-t border-border/60 bg-cream-deep/40">
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <Kicker>A Growing Network</Kicker>
            <h2 className="mt-4 font-display text-4xl font-semibold text-primary sm:text-5xl">
              Long-term Programs You Can Support
            </h2>
            <p className="mt-4 text-muted-foreground">
              Starting with a vetted set of partners and expanding continuously. Each program is a
              multi-year commitment restoration, education, community resilience not a one-off
              project.
            </p>
          </div>
          <Link
            to="/initiatives"
            className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Explore All
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="space-y-4">
                <div className="aspect-video w-full animate-pulse rounded-3xl bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-8 w-full animate-pulse rounded bg-muted" />
                <div className="h-12 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-10 rounded-3xl border border-dashed border-red-200 bg-red-50/30 p-12 text-center">
            <p className="text-red-600 font-medium">
              Failed to load initiatives. Please try again later.
            </p>
          </div>
        ) : initiatives && initiatives.length > 0 ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {initiatives.map((i) => (
              <div
                key={i.id}
                className="group overflow-hidden rounded-3xl border border-border/40 bg-card transition hover:border-primary/40 shadow-sm"
              >
                <div className="aspect-video bg-muted overflow-hidden">
                  {i.image_url ? (
                    <img
                      src={i.image_url}
                      alt={i.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-muted/60 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-primary/20" />
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <span className="text-xs font-medium uppercase text-muted-foreground">
                    {getJoinedField(i.organizations, "organization_name")}
                  </span>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-primary">
                    {i.title}
                  </h3>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {i.summary || i.description}
                  </p>
                  <div className="mt-8 flex items-center justify-between">
                    <div className="text-xs font-medium text-primary">
                      Rs{" "}
                      {Math.round(
                        Math.min(
                          100,
                          (Number(i.current_amount_mur || 0) /
                            Math.max(1, Number(i.goal_amount_mur || 0))) *
                            100,
                        ),
                      )}
                      % Funded • Rs
                      {Number(i.goal_amount_mur || 0).toLocaleString()}
                    </div>
                    <Link
                      to="/initiatives/$slug"
                      params={{ slug: i.slug }}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      Support →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-card/60 p-12 text-center">
            <p className="text-muted-foreground">
              New initiatives are being onboarded — check back soon.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

function ForOrgs() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border/60">
          <img
            src={orgsBoardroom}
            alt="Organization boardroom"
            width={1280}
            height={896}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <div>
          <h2 className="font-display text-4xl font-semibold text-primary sm:text-5xl">
            Built for Organizations
          </h2>
          <p className="mt-4 text-muted-foreground">
            Spend less time chasing donors and more time on the work itself. CommonGround delivers
            structured, recurring funding designed for long-horizon programs restoration,
            conservation, education the kind of work that takes years, not quarters.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Predictable monthly funding cycles",
              "Streamlined impact reporting tools",
              "Direct connection to active members",
            ].map((t) => (
              <li key={t} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="text-foreground/80">{t}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Link
              to="/partner"
              className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Partner With Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "How does CommonGround membership work?",
    a: "You pick a monthly contribution, choose one or more vetted initiatives, and we handle the rest recurring billing, allocation, receipts, and impact updates.",
  },
  {
    q: "How are initiatives vetted?",
    a: "Every partner is reviewed for legal status, governance, financial transparency and demonstrated long-term impact before being listed.",
  },
  {
    q: "Can I change or cancel my membership?",
    a: "Yes. You can adjust your monthly amount, switch allocations, pause or cancel anytime from your dashboard.",
  },
  {
    q: "Is my contribution tax-deductible?",
    a: "Where partner Organizations are registered for tax-deductible giving, you'll receive an automated receipt at year-end.",
  },
  {
    q: "How do I know my impact is real?",
    a: "Members receive unified, audited impact reports plus direct field updates from the organizations they support.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="border-t border-border/60 bg-card">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <Kicker>FAQ</Kicker>
          <h2 className="mt-4 font-display text-4xl font-semibold text-primary sm:text-5xl">
            Questions, answered.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Everything you need to know about how CommonGround works, our vetting process, and what
            your membership unlocks.
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {FAQS.map((f, i) => (
            <AccordionItem key={f.q} value={`q-${i}`} className="border-b border-border/60">
              <AccordionTrigger className="text-left font-display text-lg text-primary hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="border-t border-border/60">
      <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-semibold text-primary sm:text-6xl">
          Start Supporting Today
        </h2>
        <p className="mx-auto mt-5 max-w-2xl text-muted-foreground">
          Join thousands of members who are making a structured difference. Your contribution,
          amplified by our community, creates lasting change.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/initiatives/$slug"
            params={{ slug: i.slug }}
            className="inline-flex items-center justify-center rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Become a Member
          </Link>
          <Link
            to="/partner"
            className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-card px-7 py-3.5 text-sm font-medium text-primary hover:bg-cream-deep"
          >
            I represent an Organization
          </Link>
        </div>
      </div>
    </section>
  );
}
