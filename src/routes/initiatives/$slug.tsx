import { isUUID } from '@/lib/identifiers';
import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Share2,
  Heart,
  ShieldCheck,
  MapPin,
  Calendar,
  Users,
  AlertCircle,
  ExternalLink,
  Lightbulb
} from "lucide-react";
import { toast } from "sonner";
import { getJoinedData } from "@/lib/utils";
import { InitiativeCard } from "@/components/InitiativeCard";
import { setAttribution } from "@/lib/attribution";
import { attributionService } from "@/lib/attribution-service";

export const Route = createFileRoute("/initiatives/$slug")({
  head: (ctx: any) => {
    const initiative = ctx.loaderData?.initiative;
    const title = initiative?.title ? `${initiative.title} — CommonGround` : "Initiative — CommonGround";
    const description = initiative?.summary || initiative?.description || "High-impact social initiative in Mauritius.";
    const image = initiative?.image_url || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200";
    const canonical = typeof window !== "undefined" ? window.location.href : "";

    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:image", content: image },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: image },
        { rel: "canonical", href: canonical }
      ],
    };
  },
  loader: async ({ params }: { params: any }) => {
    const { slug } = params;
    const { data: initiative } = await supabase
      .from("initiatives")
      .select("*")
      .eq("slug", slug)
      .eq("is_approved", true)
      .eq("is_published", true)
      .maybeSingle();

    return { initiative };
  },
  component: InitiativeDetailPage,
});

function InitiativeDetailPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const queryKeys = useMemo(() => [["initiative-slug", slug], ["public-initiatives"]], [slug]);
  useRealtimeSync("initiatives", queryKeys);

  const {
    data: initiative,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["initiative-slug", slug],
    queryFn: async () => {
      let query = supabase
        .from("initiatives")
        .select("*, organizations(*)")
        .eq("is_approved", true)
        .eq("is_published", true);

      if (isUUID(slug)) {
        query = query.eq("id", slug);
      } else {
        query = query.eq("slug", slug);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: relatedInitiatives } = useQuery({
    queryKey: ["related-initiatives", initiative?.organization_id],
    enabled: !!initiative?.organization_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, organizations(*)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .eq("organization_id", initiative!.organization_id as string)
        .neq("id", initiative!.id)
        .limit(3);
      return data as any[];
    },
  });

  useEffect(() => {
    if (initiative && initiative.slug && initiative.slug !== slug) {
      navigate({ to: "/initiatives/$slug", params: { slug: initiative.slug }, replace: true });
    }
  }, [initiative, slug, navigate]);

  useEffect(() => {
    if (initiative) {
      setAttribution(initiative.id);

      const recordPageView = async () => {
        if (typeof window === "undefined") return;
        const sessionId = sessionStorage.getItem("cg_session_id") || Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem("cg_session_id", sessionId);

        const lastViewedKey = `last_viewed_${initiative.id}`;
        const lastViewed = sessionStorage.getItem(lastViewedKey);
        const now = Date.now();

        if (!lastViewed || now - parseInt(lastViewed) > 1000 * 60 * 30) {
          const attribution = attributionService.getStored();
          let campaignLinkId = null;

          if (attribution?.tracking_code) {
             const { data: linkData } = await supabase
               .from('campaign_links' as any)
               .select('id')
               .eq('tracking_code', attribution.tracking_code)
               .maybeSingle();
             campaignLinkId = (linkData as any)?.id;
          }

          await supabase.from("initiative_events" as any).insert({
            initiative_id: initiative.id,
            event_type: "page_view",
            session_id: sessionId,
            campaign_link_id: campaignLinkId,
            metadata: {
              referrer: document.referrer,
              userAgent: navigator.userAgent,
              utm_source: attribution?.utm_source,
              utm_medium: attribution?.utm_medium,
              utm_campaign: attribution?.utm_campaign
            }
          });
          sessionStorage.setItem(lastViewedKey, now.toString());
        }
      };
      recordPageView();
    }
  }, [initiative]);

  const handleShare = async () => {
    if (typeof window === "undefined") return;

    const shareData = {
      title: initiative?.title || "CommonGround Initiative",
      text: initiative?.summary || initiative?.description || "Check out this high-impact initiative on CommonGround.",
      url: window.location.href,
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        await supabase.from("initiative_events" as any).insert({
          initiative_id: initiative?.id,
          event_type: "share",
          metadata: { method: "native" }
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
        await supabase.from("initiative_events" as any).insert({
          initiative_id: initiative?.id,
          event_type: "share",
          metadata: { method: "clipboard" }
        });
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const trackCtaClick = async () => {
    if (!initiative) return;
    await supabase.from("initiative_events" as any).insert({
      initiative_id: initiative.id,
      event_type: "cta_click",
      metadata: {
        destination: "/signup",
        label: "Support this Initiative"
      }
    });
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Skeleton className="h-[400px] w-full rounded-[3rem]" />
              <div className="space-y-4">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-2/3" />
              </div>
            </div>
            <Skeleton className="h-[600px] rounded-[3rem]" />
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error || !initiative) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center px-4">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="text-3xl font-display font-bold text-primary mb-2">Initiative Not Found</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            The initiative you're looking for might have been archived or the link is incorrect.
          </p>
          <Link
            to="/initiatives"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 font-bold text-white transition hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" /> Explore Other Initiatives
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const gallery = Array.isArray(initiative.gallery_urls) ? initiative.gallery_urls : [];
  const progress = (Number(initiative.current_amount_mur || 0) / Number(initiative.goal_amount_mur || 1)) * 100;
  const organization = getJoinedData(initiative.organizations);

  return (
    <SiteLayout>
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
      <article className="pb-24">
        {/* Top Hero Section */}
        <div className="relative h-[50vh] min-h-[400px] w-full overflow-hidden bg-primary/5">
          {initiative.image_url ? (
            <img
              src={initiative.image_url}
              alt={initiative.title}
              className="h-full w-full object-cover"
              loading="eager"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
              <Heart className="h-24 w-24 text-primary/10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12">
            <div className="mx-auto max-w-7xl">
              <Link
                to="/initiatives"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Initiatives
              </Link>
              <h1 className="mt-6 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                {initiative.title || "Untitled Initiative"}
              </h1>
              <div className="mt-6 flex flex-wrap items-center gap-4 text-white/90">
                <span className="flex items-center gap-2 rounded-full bg-forest/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-forest-light backdrop-blur-sm border border-forest/30">
                  <CheckCircle2 className="h-3 w-3" /> Active Initiative
                </span>
                {initiative.category && (
                  <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest backdrop-blur-sm border border-white/20">
                    {initiative.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              {/* Hero Image */}
              <div className="relative aspect-[16/9] overflow-hidden rounded-[3rem] shadow-2xl shadow-primary/10">
                <img
                  src={initiative.image_url || "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=1200"}
                  alt={initiative.title}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-2 rounded-full bg-forest/20 px-4 py-1 text-xs font-bold uppercase tracking-widest text-forest-light backdrop-blur-sm border border-forest/30">
                      <MapPin className="h-3 w-3" /> Mauritius
                    </span>
                    <span className="rounded-full bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white backdrop-blur-sm border border-white/20">
                      {initiative.category || "Social Impact"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="mt-12 space-y-6">
                <h1 className="font-display text-4xl font-extrabold tracking-tight text-primary sm:text-5xl lg:text-6xl leading-[1.1]">
                  {initiative.title}
                </h1>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-4 py-4 border-y border-border/40">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50">
                      <Users className="h-5 w-5 text-primary/60" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Partnership</span>
                      <span className="text-sm font-bold text-primary">{organization?.organization_name || "CommonGround Verified"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/50">
                      <Calendar className="h-5 w-5 text-primary/60" />
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Launched</span>
                      <span className="text-sm font-bold text-primary">{new Date(initiative.created_at).toLocaleDateString('en-MU', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  </div>
                </div>

                {/* Content Sections */}
                <div className="prose prose-forest max-w-none pt-6">
                  <div className="text-xl font-medium leading-relaxed text-muted-foreground mb-12">
                    {initiative.summary || initiative.caption}
                  </div>

                  <h3 className="font-display text-2xl font-semibold text-primary mb-6">About the Initiative</h3>
                  <div className="text-lg leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {initiative.description}
                  </div>

                  {(initiative.short_term_goals || initiative.long_term_vision || initiative.expected_outcomes) && (
                    <div className="mt-12 grid gap-6 sm:grid-cols-2">
                      {initiative.short_term_goals && (
                        <div className="rounded-3xl bg-muted/30 p-6 border border-border/40">
                          <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Short-term Goals</h5>
                          <p className="text-sm leading-relaxed text-primary/80 whitespace-pre-wrap">{initiative.short_term_goals}</p>
                        </div>
                      )}
                      {initiative.long_term_vision && (
                        <div className="rounded-3xl bg-muted/30 p-6 border border-border/40">
                          <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Long-term Vision</h5>
                          <p className="text-sm leading-relaxed text-primary/80 whitespace-pre-wrap">{initiative.long_term_vision}</p>
                        </div>
                      )}
                      {initiative.expected_outcomes && (
                        <div className="rounded-3xl bg-forest/5 p-6 border border-forest/10">
                          <h5 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-forest mb-3">
                            <Lightbulb className="h-3 w-3" /> Expected Outcomes
                          </h5>
                          <p className="text-sm leading-relaxed text-forest/80 whitespace-pre-wrap">{initiative.expected_outcomes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Gallery */}
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

              {/* Organization Profile Summary */}
              {organization && (
                <div className="rounded-[2.5rem] border border-border/40 bg-muted/30 p-8 sm:p-12 mt-16">
                  <div className="flex flex-col sm:flex-row gap-8 items-start">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-3xl border-4 border-white shadow-xl bg-white">
                      {organization.logo_url ? (
                        <img src={organization.logo_url} className="h-full w-full object-cover" alt="" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-primary text-white text-3xl font-bold">
                          {organization.organization_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display text-2xl font-bold text-primary">
                        {organization.organization_name}
                      </h3 >
                      <p className="mt-4 text-muted-foreground leading-relaxed line-clamp-3">
                        {organization.description || "Leading systemic change through vetted social impact programs."}
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

            {/* Sidebar Sticky Card */}
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-[2.5rem] border border-border/40 bg-card p-8 shadow-2xl shadow-primary/5">
                <div className="mb-8 flex items-center justify-between">
                  <div className="rounded-full bg-forest/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-forest">
                    Funding Status
                  </div>
                  <button
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                    title="Share Initiative"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="block text-3xl font-bold tracking-tight text-primary">
                        Rs {Number(initiative.current_amount_mur || 0).toLocaleString()}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-muted-foreground">
                        raised of Rs {Number(initiative.goal_amount_mur || 0).toLocaleString()} goal
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-forest">
                        {Math.round(progress)}%
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Funded
                      </span>
                    </div>
                  </div>

                  <div className="h-3 w-full overflow-hidden rounded-full bg-muted/50">
                    <div
                      className="h-full bg-forest transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-2">
                    <div className="rounded-2xl bg-muted/30 p-5 text-center">
                      <Users className="mx-auto mb-2 h-5 w-5 text-primary/40" />
                      <span className="block text-xl font-bold text-primary">
                        {initiative.active_supporter_count || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Active
                      </span>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-5 text-center">
                      <Heart className="mx-auto mb-2 h-5 w-5 text-primary/40" />
                      <span className="block text-xl font-bold text-primary">
                        {initiative.conversion_count || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Members
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Link
                    to="/signup"
                    onClick={trackCtaClick}
                    className="flex w-full items-center justify-center rounded-full bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.98]"
                  >
                    Support this Initiative
                  </Link>
                  <p className="px-4 text-center text-[10px] leading-relaxed text-muted-foreground">
                    100% of your contribution (minus transaction fees) goes directly to the
                    initiative. We provide full transparency reports every quarter.
                  </p>
                </div>

                <div className="mt-10 rounded-2xl border border-primary/10 bg-primary/5 p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                      CommonGround Vetted
                    </span>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-primary/70">
                    This Organization has passed our deep due-diligence process, including financial
                    audit and site visits.
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
