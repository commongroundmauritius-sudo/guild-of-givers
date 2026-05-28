import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Repeat,
  Eye,
  Target,
  UserPlus,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Clock
} from "lucide-react";
import { InitiativeCard } from "@/components/InitiativeCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Kicker } from "@/components/Kicker";
import { useCuratedInitiatives } from "@/hooks/initiatives/use-curated-initiatives";
import { useActivityTracker } from "@/hooks/activities/use-activity-tracker";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CommonGround — One Membership. Long-term Impact." },
      {
        name: "description",
        content: "Turn one monthly membership into predictable funding for vetted, long-term social impact programs.",
      },
      { property: "og:title", content: "CommonGround — One Membership. Long-term Impact." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  useActivityTracker({ eventType: 'homepage_view' });
  const { featured, urgent, trending, newest } = useCuratedInitiatives();

  return (
    <SiteLayout>
      <Hero />
      <ValueProps />

      {/* Featured Section */}
      <CuratedSection
        title="Featured Initiatives"
        subtitle="Vetted programs making a significant impact right now."
        initiatives={featured.data}
        isLoading={featured.isLoading}
        icon={Sparkles}
        kicker="Handpicked"
      />

      {/* Urgent Section */}
      <CuratedSection
        title="Urgent Funding Gaps"
        subtitle="These programs need immediate support to maintain their vital operations."
        initiatives={urgent.data}
        isLoading={urgent.isLoading}
        icon={AlertCircle}
        kicker="Critical"
        bgClassName="bg-cream-deep/30"
      />

      {/* Trending Section */}
      <CuratedSection
        title="Trending Programs"
        subtitle="Initiatives seeing the most growth in our community."
        initiatives={trending.data}
        isLoading={trending.isLoading}
        icon={TrendingUp}
        kicker="Active"
      />

      {/* Newest Section */}
      <CuratedSection
        title="Recently Onboarded"
        subtitle="New partners joining the CommonGround network."
        initiatives={newest.data}
        isLoading={newest.isLoading}
        icon={Clock}
        kicker="New"
        bgClassName="bg-cream-deep/30"
      />

      <ForOrgs />
      <FAQ />
      <FinalCTA />
    </SiteLayout>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-cream-deep pb-20 pt-32 lg:pt-48">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Vetted. Stable. Long-term.
          </div>
          <h1 className="mt-8 font-display text-5xl font-extrabold tracking-tight text-primary sm:text-7xl lg:text-8xl leading-[0.9]">
            One Membership. <br />
            <span className="text-forest">Endless Impact.</span>
          </h1>
          <p className="mt-8 text-xl leading-relaxed text-muted-foreground sm:text-2xl max-w-2xl">
            We turn predictable monthly contributions into reliable funding for Mauritius' most effective
            long-horizon social programs.
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to="/signup"
              className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-sm font-bold text-white shadow-xl shadow-primary/20 transition hover:bg-primary/90 hover:shadow-2xl active:scale-95"
            >
              Start Supporting
            </Link>
            <Link
              to="/initiatives"
              className="inline-flex h-14 items-center justify-center rounded-full border border-primary/10 bg-white/50 px-8 text-sm font-bold text-primary backdrop-blur-sm transition hover:bg-white hover:shadow-lg"
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

interface CuratedSectionProps {
  title: string;
  subtitle: string;
  initiatives?: any[];
  isLoading: boolean;
  icon: any;
  kicker: string;
  bgClassName?: string;
}

function CuratedSection({
  title,
  subtitle,
  initiatives,
  isLoading,
  icon: Icon,
  kicker,
  bgClassName = "bg-white"
}: CuratedSectionProps) {
  if (!isLoading && (!initiatives || initiatives.length === 0)) return null;

  return (
    <section className={bgClassName}>
      <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <Kicker>{kicker}</Kicker>
            </div>
            <h2 className="mt-4 font-display text-4xl font-semibold text-primary">
              {title}
            </h2>
            <p className="mt-4 text-muted-foreground">
              {subtitle}
            </p>
          </div>
          <Link
            to="/initiatives"
            className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            View More <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="space-y-4">
                <div className="aspect-video w-full animate-pulse rounded-[2rem] bg-muted" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-6 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {initiatives?.map((i) => (
              <div key={i.id} className="scale-[0.95] origin-top">
                <InitiativeCard initiative={i} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ForOrgs() {
  return (
    <section className="border-t border-border/60 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-border/60 aspect-[16/10] bg-muted">
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1280"
            alt="Organization collaboration"
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
            structured, recurring funding designed for long-horizon programs—restoration,
            conservation, education—the kind of work that takes years, not quarters.
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
              to="/signup"
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
    a: "You pick a monthly contribution, choose one or more vetted initiatives, and we handle the rest—recurring billing, allocation, receipts, and impact updates.",
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
    <section id="faq" className="border-t border-border/60 bg-white">
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
    <section className="border-t border-border/60 bg-cream-deep/20">
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
            to="/signup"
            className="inline-flex items-center justify-center rounded-full border border-primary/20 bg-card px-7 py-3.5 text-sm font-medium text-primary hover:bg-cream-deep"
          >
            I represent an Organization
          </Link>
        </div>
      </div>
    </section>
  );
}
