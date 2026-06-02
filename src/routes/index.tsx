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
  Clock,
  Heart,
  LucideIcon,
} from "lucide-react";
import { InitiativeCard } from "@/components/InitiativeCard";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Kicker } from "@/components/Kicker";
import { useCuratedInitiatives } from "@/hooks/initiatives/use-curated-initiatives";
import { useActivityTracker } from "@/hooks/activities/use-activity-tracker";
import { useQuery } from "@tanstack/react-query";
import { homepageService } from "@/lib/homepage-service";
import { useHomepageAnalytics } from "@/hooks/use-homepage-analytics";
import { successStoryService } from "@/lib/success-story-service";
import { supabase } from "@/integrations/supabase/client";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

function Index() {
  useActivityTracker({ eventType: "homepage_view" });

  const { data: publishedVersion } = useQuery({
    queryKey: ["homepage", "published"],
    queryFn: () => homepageService.getPublishedVersion(),
  });

  const { trackEvent } = useHomepageAnalytics(publishedVersion?.id);

  const config = publishedVersion?.configuration_json as any;
  const sections = config?.sections || [];

  return (
    <SiteLayout>
      {sections
        .filter((s: any) => s.visible)
        .map((section: any) => (
          <div key={section.id} data-section={section.id}>
            {renderSection(section)}
          </div>
        ))}
      {sections.length === 0 && <DefaultHomepage />}
      <FinalCTA />
    </SiteLayout>
  );
}

function DefaultHomepage() {
  return (
    <div className="py-20 text-center">
      <h2 className="text-2xl font-bold">Welcome to CommonGround</h2>
      <p className="text-muted-foreground mt-2">Homepage content is being prepared.</p>
    </div>
  );
}

function renderSection(section: any) {
  switch (section.id) {
    case "hero":
      return (
        <>
          <Hero settings={section.settings} />
          <ValueProps />
        </>
      );
    case "stats":
      return null;
    case "featured":
      return <FeaturedInitiatives settings={section.settings} />;
    case "urgent":
      return <UrgentNeeds settings={section.settings} />;
    case "trending":
      return <TrendingPrograms settings={section.settings} />;
    case "volunteers":
      return <VolunteerOpportunities settings={section.settings} />;
    case "success":
      return <SuccessStories settings={section.settings} />;
    case "partners":
    case "forOrgs":
      return <ForOrgs />;
    case "faq":
      return <FAQ settings={section.settings} />;
    default:
      return null;
  }
}

function Hero({ settings }: { settings: any }) {
  return (
    <section className="relative overflow-hidden bg-cream-deep pb-20 pt-32 lg:pt-48">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
            <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            Vetted. Stable. Long-term.
          </div>
          <h1 className="mt-8 font-display text-5xl font-extrabold tracking-tight text-primary sm:text-7xl lg:text-8xl leading-[0.9]">
            {settings.headline || "One Membership. Endless Impact."}
          </h1>
          <p className="mt-8 text-xl leading-relaxed text-muted-foreground sm:text-2xl max-w-2xl">
            {settings.subheadline ||
              "We turn predictable monthly contributions into reliable funding for Mauritius' most effective long-horizon social programs."}
          </p>
          <div className="mt-12 flex flex-wrap gap-4">
            <Link
              to={settings.primaryCTA?.link || "/signup"}
              className="inline-flex h-14 items-center justify-center rounded-full bg-primary px-10 text-sm font-bold text-white shadow-xl shadow-primary/20 transition hover:bg-primary/90 hover:shadow-2xl active:scale-95"
            >
              {settings.primaryCTA?.text || "Start Supporting"}
            </Link>
            <Link
              to={settings.secondaryCTA?.link || "/initiatives"}
              className="inline-flex h-14 items-center justify-center rounded-full border border-primary/10 bg-white/50 px-8 text-sm font-bold text-primary backdrop-blur-sm transition hover:bg-white hover:shadow-lg"
            >
              {settings.secondaryCTA?.text || "Explore Initiatives"}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function ValueProps() {
  return (
    <section className="bg-white py-24 border-t border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map((p) => (
            <div key={p.title} className="flex flex-col items-start group">
              <div className="mb-8 rounded-full bg-muted/50 p-4 text-primary transition-colors group-hover:bg-primary/10">
                <p.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-2xl font-bold text-primary tracking-tight">
                {p.title}
              </h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const VALUE_PROPS = [
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

function FeaturedInitiatives({ settings }: { settings: any }) {
  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ["homepage-featured-manual", settings.manual_ids],
    enabled: !!settings.manual_ids && settings.manual_ids.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, organizations(organization_name)")
        .in("id", settings.manual_ids);

      const results = data || [];
      return results.sort(
        (a, b) => settings.manual_ids.indexOf(a.id) - settings.manual_ids.indexOf(b.id),
      );
    },
  });

  return (
    <CuratedSection
      title="Featured Initiatives"
      subtitle="Vetted programs making a significant impact right now."
      initiatives={initiatives as any}
      isLoading={isLoading}
      icon={Sparkles}
      kicker="Handpicked"
    />
  );
}

function UrgentNeeds({ settings }: { settings: any }) {
  const { urgent } = useCuratedInitiatives();
  return (
    <CuratedSection
      title="Urgent Funding Gaps"
      subtitle="These programs need immediate support to maintain their vital operations."
      initiatives={urgent.data?.slice(0, settings.limit || 4)}
      isLoading={urgent.isLoading}
      icon={AlertCircle}
      kicker="Critical"
      bgClassName="bg-cream-deep/30"
    />
  );
}

function TrendingPrograms({ settings }: { settings: any }) {
  const { trending } = useCuratedInitiatives();
  return (
    <CuratedSection
      title="Trending Programs"
      subtitle="Initiatives seeing the most growth in our community."
      initiatives={trending.data?.slice(0, settings.limit || 4)}
      isLoading={trending.isLoading}
      icon={TrendingUp}
      kicker="Active"
    />
  );
}

function VolunteerOpportunities({ settings }: { settings: any }) {
  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ["homepage-volunteers"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, organizations(organization_name)")
        .eq("volunteer_opportunity", true)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(settings.limit || 4);
      return data || [];
    },
  });

  return (
    <CuratedSection
      title="Volunteer Opportunities"
      subtitle="Give your time and skills to make a direct difference on the ground."
      initiatives={initiatives as any}
      isLoading={isLoading}
      icon={UserPlus}
      kicker="Volunteer"
      bgClassName="bg-cream-deep/30"
    />
  );
}

function SuccessStories({ settings }: { settings: any }) {
  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["homepage-success-stories"],
    queryFn: () => successStoryService.getPublished(),
  });

  if (!isLoading && stories.length === 0) return null;

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <Kicker>Impact Stories</Kicker>
          <h2 className="mt-4 font-display text-4xl font-semibold text-primary">Success Stories</h2>
          <p className="mt-4 text-muted-foreground">Real stories of change from our community.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [1, 2, 3].map((i) => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-[2rem]" />
              ))
            : stories.slice(0, settings.limit || 3).map((story) => (
                <div
                  key={story.id}
                  className="group relative flex flex-col overflow-hidden rounded-[2.5rem] bg-muted/30 border border-border/40 transition-all hover:shadow-xl"
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={story.image_url || ""}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex-1 p-8">
                    <h3 className="text-xl font-bold text-primary mb-3">{story.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                      {story.summary}
                    </p>
                    {story.cta_link && (
                      <Link
                        to={story.cta_link}
                        className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                      >
                        Read Full Story <ArrowRight className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
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
  icon: LucideIcon;
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
  bgClassName = "bg-white",
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
            <h2 className="mt-4 font-display text-4xl font-semibold text-primary">{title}</h2>
            <p className="mt-4 text-muted-foreground">{subtitle}</p>
          </div>
          <Link
            to="/initiatives"
            className="group inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
          >
            View More{" "}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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


function FAQ({ settings }: { settings: any }) {
  const defaultFaqs = [
    {
      q: 'How does CommonGround membership work?',
      a: 'You pick a monthly contribution, choose one or more vetted initiatives, and we handle the rest—recurring billing, allocation, receipts, and impact updates.',
    },
    {
      q: 'How are initiatives vetted?',
      a: 'Every partner is reviewed for legal status, governance, financial transparency and demonstrated long-term impact before being listed.',
    },
    {
      q: 'Can I change or cancel my membership?',
      a: 'Yes. You can adjust your monthly amount, switch allocations, pause or cancel anytime from your dashboard.',
    },
    {
      q: 'Is my contribution tax-deductible?',
      a: 'Where partner Organizations are registered for tax-deductible giving, you\'ll receive an automated receipt at year-end.',
    },
    {
      q: 'How do I know my impact is real?',
      a: 'Members receive unified, audited impact reports plus direct field updates from the organizations they support.',
    },
  ];

  const items = settings?.items || defaultFaqs;
  const title = settings?.title || 'Questions, answered.';
  const description = settings?.description || 'Everything you need to know about how CommonGround works, our vetting process, and what your membership unlocks.';

  return (
    <section id="faq" className="border-t border-border/60 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <Kicker>FAQ</Kicker>
          <h2 className="mt-4 font-display text-4xl font-semibold text-primary sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-muted-foreground">
            {description}
          </p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {items.map((f: any, i: number) => (
            <AccordionItem key={i} value={`q-${i}`} className="border-b border-border/60">
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
