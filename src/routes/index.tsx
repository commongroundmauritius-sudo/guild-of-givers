import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo } from "react";

import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import heroRoom from "@/assets/hero-room.jpg";
import orgsBoardroom from "@/assets/orgs-boardroom.jpg";
import { UserPlus, Sparkles, Eye, Target, Repeat } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InitiativeCard } from "@/components/InitiativeCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CommonGround — One Membership. Long-term Impact." },
      {
        name: "description",
        content:
          "Turn one monthly membership into predictable funding for vetted, long-term social impact programs.",
      },
      { property: "og:title", content: "CommonGround — One Membership. Long-term Impact." },
      { property: "og:description", content: " predictable funding for vetted, long-term social impact programs." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <SiteLayout>
      <Hero />
      <ValueProps />
      <InitiativesList />
      <ForOrgs />
      <FAQ />
      <FinalCTA />
    </SiteLayout>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
      {children}
    </span>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[90vh] flex-col justify-center overflow-hidden bg-[#faf8f6]">
      <div className="absolute inset-0 z-0">
        <img
          src={heroRoom}
          alt="Modern interior with natural light"
          width={1920}
          height={1080}
          className="h-full w-full object-cover opacity-[0.08] grayscale"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#faf8f6]/50 to-[#faf8f6]" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          <Kicker>The New Standard for Giving</Kicker>
          <h1 className="mt-8 font-display text-6xl font-bold tracking-tight text-primary sm:text-7xl lg:text-8xl">
            One Membership. <br />
            <span className="text-primary/40 italic font-medium">Long-term Impact.</span>
          </h1>
          <p className="mt-8 max-w-2xl text-xl leading-relaxed text-muted-foreground sm:text-2xl">
            Turn one monthly membership into predictable, structured funding for vetted social
            programs in Mauritius. No more one-off donations. Just lasting change.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition hover:bg-primary/90 hover:shadow-2xl active:scale-95"
            >
              Become a Member
            </Link>
            <Link
              to="/initiatives"
              className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-white/50 px-8 py-4 text-sm font-bold text-primary backdrop-blur-sm transition hover:bg-white hover:shadow-lg"
            >
              Explore Initiatives
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

const PROPS = [
  {
    icon: UserPlus,
    title: "Vetted Partners",
    desc: "We perform deep due-diligence on every organization to ensure your support reaches the most effective teams.",
  },
  {
    icon: Repeat,
    title: "Predictable Funding",
    desc: "Monthly memberships allow organizations to plan years ahead, focusing on systemic solutions rather than fundraising.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    desc: "Track exactly where your contribution goes with unified impact reports and real-time dashboard updates.",
  },
  {
    icon: Target,
    title: "Root Cause Focus",
    desc: "We prioritize long-horizon programs in restoration, education, and resilience that solve problems at the source.",
  },
];

function ValueProps() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {PROPS.map((p) => (
            <div key={p.title} className="flex flex-col items-start">
              <div className="mb-6 rounded-2xl bg-primary/5 p-4 text-primary">
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-semibold text-primary">{p.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InitiativesList() {
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
        .select("*, organizations(organization_name)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .limit(3)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="bg-cream-deep/40">
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
              <InitiativeCard key={i.id} initiative={i} />
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
            to="/signup"
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
