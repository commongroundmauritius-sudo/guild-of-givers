import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Share2, Heart, ShieldCheck, MapPin, Calendar, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/initiatives/$slug")({
  head: () => ({
    meta: [{ title: "Initiative Detail — CommonGround" }],
  }),
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
      let resultData;
      const { data, error: slugError } = await supabase
        .from("initiatives")
        .select("*, organizations!inner(*)")
        .eq("slug", slug)
        .eq("is_approved", true)
        .eq("is_published", true)
        .eq("organizations.status", "active")
        .maybeSingle();

      if (slugError) throw slugError;
      resultData = data;

      if (!resultData) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(slug)) {
          const { data: byId, error: errorId } = await supabase
            .from("initiatives")
            .select("*, organizations!inner(*)")
            .eq("id", slug)
            .eq("is_approved", true)
            .eq("is_published", true)
            .eq("organizations.status", "active")
            .maybeSingle();

          if (errorId) throw errorId;
          resultData = byId;
        }
      }

      return resultData;
    },
  });

  useEffect(() => {
    if (initiative && initiative.slug && initiative.slug !== slug) {
      navigate({ to: "/initiatives/$slug", params: { slug: initiative.slug }, replace: true });
    }
  }, [initiative, slug, navigate]);

  useEffect(() => {
    if (initiative) {
      if (typeof window !== "undefined") {
        const now = Date.now();
        const expiresAt = now + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem("source_initiative_id", initiative.id);
        localStorage.setItem("source_initiative_expires_at", expiresAt.toString());
      }

      const recordPageView = async () => {
        if (typeof window === "undefined") return;

        const sessionId = sessionStorage.getItem("cg_session_id") ||
                         Math.random().toString(36).substring(2, 15);
        sessionStorage.setItem("cg_session_id", sessionId);

        const lastViewedKey = `last_viewed_${initiative.id}`;
        const lastViewed = sessionStorage.getItem(lastViewedKey);

        const now = Date.now();
        if (!lastViewed || now - parseInt(lastViewed) > 1000 * 60 * 30) {
          const { error: insertError } = await supabase.from("initiative_events").insert({
            initiative_id: initiative.id,
            event_type: "page_view",
            session_id: sessionId,
          });

          if (!insertError) {
            sessionStorage.setItem(lastViewedKey, now.toString());
          }
        }
      };

      recordPageView();
    }
  }, [initiative]);

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <Skeleton className="h-[40vh] w-full rounded-[3rem]" />
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error || !initiative) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-600">
            <Heart className="h-8 w-8" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary">Initiative not found</h1>
          <p className="mt-4 text-muted-foreground">
            The initiative you are looking for might have been removed or is currently under review.
          </p>
          <Link
            to="/initiatives"
            className="mt-8 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" /> Back to all initiatives
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const organization = (initiative as any).organizations;
  const progress = Math.min(
    100,
    ((Number(initiative.current_amount_mur) || 0) /
      Math.max(1, Number(initiative.goal_amount_mur) || 0)) *
      100,
  );
  const gallery = Array.isArray(initiative.gallery_urls) ? initiative.gallery_urls : [];

  return (
    <SiteLayout>
      <article className="pb-24">
        <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden">
          {initiative.image_url ? (
            <img
              src={initiative.image_url}
              alt={initiative.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="font-display text-xl font-medium text-primary/40">
                No Image Available
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12">
            <div className="mx-auto max-w-7xl">
              <Link
                to="/initiatives"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Initiatives
              </Link>
              <h1 className="mt-6 font-display text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
                {initiative.title}
              </h1>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <div className="flex flex-wrap items-center gap-6 border-b border-border/60 pb-8">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                    {organization?.logo_url ? (
                      <img
                        src={organization.logo_url}
                        alt={organization.organization_name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold uppercase">
                        {organization?.organization_name?.charAt(0) || "N"}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Managed by
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {organization?.organization_name || "Organization Partner"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <MapPin className="h-4 w-4 text-primary/40" />
                  <span>Mauritius</span>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Calendar className="h-4 w-4 text-primary/40" />
                  <span>
                    Launched{" "}
                    {new Date(initiative.created_at).toLocaleDateString("en-MU", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>

              <div className="mt-10 max-w-none">
                <p className="text-xl font-medium leading-relaxed text-primary/80">
                  {initiative.caption}
                </p>
                <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                  {initiative.summary || initiative.description}
                </p>

                <div className="mt-10 space-y-6 border-t border-border/40 pt-10 text-primary/90">
                  <h3 className="font-display text-2xl font-semibold text-primary">
                    The Challenge & Solution
                  </h3>
                  {initiative.content ? (
                    initiative.content.split("\n").map((para: string, idx: number) => (
                      <p key={idx} className="text-base leading-relaxed">
                        {para}
                      </p>
                    ))
                  ) : (
                    <p className="text-base leading-relaxed">{initiative.description}</p>
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
                        className="aspect-[4/3] overflow-hidden rounded-[2rem] bg-muted shadow-sm"
                      >
                        <img
                          src={url}
                          alt={`${initiative.title} gallery ${idx + 1}`}
                          className="h-full w-full object-cover transition duration-500 hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-[2.5rem] border border-border/40 bg-card p-8 shadow-2xl shadow-primary/5">
                <div className="mb-8 flex items-center justify-between">
                  <div className="rounded-full bg-forest/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-forest">
                    Active Initiative
                  </div>
                  <button
                    onClick={handleShare}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/50 text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
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
                      <span className="block text-xl font-bold text-primary">{initiative.active_supporter_count || 0}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Active
                      </span>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-5 text-center">
                      <Heart className="mx-auto mb-2 h-5 w-5 text-primary/40" />
                      <span className="block text-xl font-bold text-primary">{initiative.conversion_count || 0}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Total Members
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Link
                    to="/signup"
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
