import { useMemberCheck } from "@/hooks/use-member-check";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Heart,
  Share2,
  ShieldCheck,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { attributionService } from "@/lib/attribution-service";
import { isUUID } from "@/lib/identifiers";
import { logInitiativeEvent } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/initiatives/$slug")({
  loader: async ({ params }: { params: any }) => {
    const { slug } = params;
    const { data: initiativeBySlug } = await supabase
      .from("initiatives")
      .select("id, slug")
      .eq("slug", slug)
      .maybeSingle();

    if (initiativeBySlug) return { initiativeId: initiativeBySlug.id };

    if (isUUID(slug)) {
      const { data: initiativeById } = await supabase
        .from("initiatives")
        .select("id, slug")
        .eq("id", slug)
        .maybeSingle();

      if (initiativeById) return { initiativeId: initiativeById.id };
    }

    throw new Error("Initiative not found");
  },
  component: InitiativeDetailPage,
});

function InitiativeDetailPage() {
  const { handleMemberAction } = useMemberCheck();
  const { initiativeId } = Route.useLoaderData();
  const navigate = useNavigate();
  const { slug } = Route.useParams();

  const { data: initiative, isLoading } = useQuery({
    queryKey: ["initiative", initiativeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*, organizations(*)")
        .eq("id", initiativeId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: currentCycle } = useQuery({
    queryKey: ["initiative-funding-cycle", initiativeId],
    queryFn: async () => {
      const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Indian/Mauritius",
        year: "numeric",
        month: "2-digit",
      }).formatToParts(new Date());
      const month = Number(parts.find((part) => part.type === "month")?.value);
      const year = Number(parts.find((part) => part.type === "year")?.value);

      const { data, error } = await supabase
        .from("initiative_funding_cycles")
        .select("target_amount_mur, received_amount_mur, status, month, year")
        .eq("initiative_id", initiativeId)
        .eq("month", month)
        .eq("year", year)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!initiativeId,
  });

  useEffect(() => {
    if (initiative?.slug && initiative.slug !== slug) {
      navigate({ to: "/initiatives/$slug", params: { slug: initiative.slug }, replace: true });
    }
  }, [initiative, navigate, slug]);

  useEffect(() => {
    attributionService.captureFromUrl();
    if (initiativeId) {
      localStorage.setItem("source_initiative_id", initiativeId);
      logInitiativeEvent({ data: { initiativeId, eventType: "page_view" } }).catch(console.error);
    }
  }, [initiativeId]);

  const trackCtaClick = async () => {
    if (initiativeId) {
      await logInitiativeEvent({
        data: {
          initiativeId,
          eventType: "cta_click",
          metadata: {
            url: typeof window !== "undefined" ? window.location.href : "",
            source: "initiative_detail_primary",
          },
        },
      });
    }
  };

  const handleShare = async () => {
    if (typeof window !== "undefined") {
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
        if (initiativeId) {
          await logInitiativeEvent({
            data: {
              initiativeId,
              eventType: "share",
              metadata: { url: window.location.href },
            },
          });
        }
      } catch {
        toast.error("Failed to copy link");
      }
    }
  };

  if (isLoading) return <div className="p-20 text-center">Loading initiative...</div>;
  if (!initiative) return <div className="p-20 text-center">Initiative not found.</div>;

  const monthlyTarget = Math.max(0, Number(initiative.monthly_target_mur) || 0);
  const cycleReceived = Math.max(
    0,
    Number(currentCycle?.received_amount_mur) || 0,
  );
  const cycleProgress =
    monthlyTarget > 0 ? Math.min(100, (cycleReceived / monthlyTarget) * 100) : 0;

  const organization = initiative.organizations;
  const gallery = Array.isArray(initiative.gallery_urls)
    ? (initiative.gallery_urls as string[])
    : [];

  return (
    <SiteLayout>
      <article className="relative bg-white pb-32">
        <div className="relative h-[45vh] w-full overflow-hidden sm:h-[65vh]">
          <img
            src={
              initiative.image_url ||
              "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800"
            }
            alt={initiative.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 pb-12 sm:pb-20">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-md">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-forest" />
                  Active Initiative
                </div>
                <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
                  {initiative.title}
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-16">
            <div className="lg:col-span-2">
              <div className="py-12 lg:py-20">
                <div className="prose prose-forest max-w-none">
                  <div className="whitespace-pre-wrap text-lg leading-relaxed text-foreground/80">
                    {initiative.description}
                  </div>

                  {(initiative.short_term_goals ||
                    initiative.long_term_goals ||
                    initiative.expected_outcomes) && (
                    <div className="mt-12 grid gap-6 sm:grid-cols-2">
                      {initiative.short_term_goals && (
                        <div className="rounded-3xl border border-border/40 bg-muted/30 p-6">
                          <h5 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Short-term Goals
                          </h5>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary/80">
                            {initiative.short_term_goals}
                          </p>
                        </div>
                      )}
                      {initiative.long_term_goals && (
                        <div className="rounded-3xl border border-border/40 bg-muted/30 p-6">
                          <h5 className="mb-3 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                            Long-term Goals
                          </h5>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-primary/80">
                            {initiative.long_term_goals}
                          </p>
                        </div>
                      )}
                      {initiative.expected_outcomes && (
                        <div className="rounded-3xl border border-forest/10 bg-forest/5 p-6">
                          <h5 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-forest">
                            <Lightbulb className="h-3 w-3" /> Expected Outcomes
                          </h5>
                          <p className="whitespace-pre-wrap text-sm leading-relaxed text-forest/80">
                            {initiative.expected_outcomes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {gallery.length > 0 && (
                <div className="mt-16">
                  <h3 className="font-display text-2xl font-semibold text-primary">
                    Project Gallery
                  </h3>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {gallery.map((url: string, idx: number) => (
                      <div
                        key={idx}
                        className="group relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-muted shadow-sm"
                      >
                        <img
                          src={url}
                          alt={`${initiative.title} gallery ${idx + 1}`}
                          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {organization && (
                <div className="mt-16 rounded-[2.5rem] border border-border/40 bg-muted/30 p-8 sm:p-12">
                  <div className="flex flex-col items-start gap-8 sm:flex-row">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-xl">
                      {organization.logo_url ? (
                        <img
                          src={organization.logo_url}
                          className="h-full w-full object-cover"
                          alt={
                            organization.organization_name
                              ? `${organization.organization_name} logo`
                              : "Organization logo"
                          }
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary text-3xl font-bold text-white">
                          {organization.organization_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-2xl font-bold text-primary">
                        {organization.organization_name}
                      </h3>
                      <p className="mt-4 line-clamp-3 leading-relaxed text-muted-foreground">
                        {organization.description ||
                          "Leading systemic change through vetted social impact programs."}
                      </p>
                      <div className="mt-6 flex flex-wrap gap-4">
                        <Link
                          to="/entities/$id"
                          params={{ id: organization.id }}
                          className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                        >
                          View Organization Profile <ArrowLeft className="h-4 w-4 rotate-180" />
                        </Link>
                        {organization.website_url && (
                          <a
                            href={organization.website_url}
                            target="_blank"
                            rel="noopener"
                            className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary"
                          >
                            Visit Website <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-[2.5rem] border border-border/40 bg-card p-8 shadow-2xl shadow-primary/5">
                <div className="mb-8 flex items-center justify-between">
                  <div className="rounded-full bg-forest/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-forest">
                    Monthly Funding Cycle
                  </div>
                  <button
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                    title="Share Initiative"
                    aria-label="Share Initiative"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="block text-3xl font-bold tracking-tight text-primary">
                        Rs {cycleReceived.toLocaleString()}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-muted-foreground">
                        received this month of Rs {monthlyTarget.toLocaleString()} target
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-forest">
                        {Math.round(cycleProgress)}%
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        This Month
                      </span>
                    </div>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className="h-full bg-forest transition-all duration-1000"
                      style={{ width: `${cycleProgress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="rounded-2xl bg-muted/30 p-5 text-center">
                      <Users className="mx-auto mb-2 h-5 w-5 text-primary/40" />
                      <span className="block text-xl font-bold text-primary">
                        {initiative.active_supporter_count || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Active Supporters
                      </span>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-5 text-center">
                      <Heart className="mx-auto mb-2 h-5 w-5 text-primary/40" />
                      <span className="block text-xl font-bold text-primary">
                        {initiative.conversion_count || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Members Acquired
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Link
                    to="/signup"
                    onClick={(e) => {
                      trackCtaClick();
                      handleMemberAction(e);
                    }}
                    className="flex w-full items-center justify-center rounded-full bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.98]"
                  >
                    Support this Initiative
                  </Link>
                  <p className="px-4 text-center text-[10px] leading-relaxed text-muted-foreground">
                    Your subscription is allocated according to your selected priorities, after
                    applicable transaction fees and CommonGround&apos;s platform share. See the
                    membership terms for details.
                  </p>
                </div>

                <div className="mt-10 rounded-2xl border border-primary/10 bg-primary/5 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                      CommonGround Vetted
                    </span>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-primary/70">
                    This organization is presented through CommonGround&apos;s partner and
                    initiative review process.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </SiteLayout>
  );
}
