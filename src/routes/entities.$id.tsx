import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Share2,
  Globe,
  Target,
  Users,
  MessageSquare,
  MapPin,
  FileText,
  BarChart3
} from "lucide-react";
import { toast } from "sonner";
import { InitiativeCard } from "@/components/InitiativeCard";

export const Route = createFileRoute("/entities/$id")({
  head: (ctx: any) => {
    const org = ctx.loaderData?.organization;
    const title = org?.organization_name ? `${org.organization_name} — CommonGround` : "Organization Profile — CommonGround";
    const description = org?.description || "Explore high-impact social programs making a difference in Mauritius.";
    const canonical = typeof window !== "undefined" ? window.location.href : "";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { rel: "canonical", href: canonical }
      ],
    };
  },
  loader: async ({ params }: { params: any }) => {
    const { id } = params;
    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    return { organization };
  },
  component: OrganizationProfilePage,
});

function OrganizationProfilePage() {
  const { id } = Route.useParams();
  const queryKeys = useMemo(() => [["organization", id], ["public-initiatives"]], [id]);
  useRealtimeSync("organizations", queryKeys);
  useRealtimeSync("initiatives", queryKeys);

  const {
    data: organization,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  const { data: initiatives } = useQuery({
    queryKey: ["org-initiatives", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*, organizations(organization_name)")
        .eq("organization_id", id)
        .eq("is_approved", true)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Profile link copied!");
    }
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <Skeleton className="h-48 w-full rounded-[3rem]" />
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Skeleton className="h-12 w-2/3" />
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
              <Skeleton className="h-[400px] w-full rounded-[2.5rem]" />
            </div>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (error || !organization) {
    return (
      <SiteLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-muted-foreground">Organization not found.</p>
        </div>
      </SiteLayout>
    );
  }

  const target = Number(organization.monthly_target_amount) || 1;
  const current = Number(organization.current_collected_amount) || 0;
  const progress = Math.min(100, (current / target) * 100);

  return (
    <SiteLayout>
      <article className="pb-24">
        {/* Banner Area */}
        <div className="h-64 w-full bg-gradient-to-br from-primary/10 to-primary/5">
          <div className="mx-auto h-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-full items-end pb-12">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
                <div className="relative h-32 w-32 shrink-0 overflow-hidden rounded-[2.5rem] border-4 border-white bg-white shadow-2xl shadow-primary/10">
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={organization.organization_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-4xl font-bold text-white uppercase">
                      {organization.organization_name.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mb-2">
                  <h1 className="font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                    {organization.organization_name}
                  </h1>
                  <div className="mt-3 flex items-center gap-4 text-sm font-medium text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-primary/40" /> Mauritius
                    </span>
                    {organization.category && (
                      <span className="rounded-full bg-primary/5 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-primary">
                        {organization.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-12">
              {/* About Section */}
              <section>
                <h2 className="font-display text-2xl font-semibold text-primary">
                  About this Organization
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                  {organization.description || "No description provided."}
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div className="rounded-3xl border border-border/40 bg-card p-6">
                    <div className="flex items-center gap-3 text-forest">
                      <Target className="h-5 w-5" />
                      <h3 className="font-semibold">Our Mission</h3>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {organization.mission || "Empowering communities through sustainable action."}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-border/40 bg-card p-6">
                    <div className="flex items-center gap-3 text-blue-500">
                      <Globe className="h-5 w-5" />
                      <h3 className="font-semibold">Website</h3>
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">
                      {organization.website_url ? (
                        <a
                          href={organization.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {organization.website_url}
                        </a>
                      ) : (
                        "N/A"
                      )}
                    </p>
                  </div>
                </div>
              </section>

              {/* Goals & Impact */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-semibold text-primary">
                    Goals & Impact Metrics
                  </h2>
                </div>
                <div className="rounded-[2rem] border border-border/40 bg-card p-8 space-y-8">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Core Goals
                    </h3>
                    <p className="mt-2 text-primary/80 whitespace-pre-wrap">
                      {organization.goals || "No goals specified yet."}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Impact to Date
                    </h3>
                    <p className="mt-2 text-primary/80 whitespace-pre-wrap">
                      {organization.impact_metrics || "No impact metrics reported yet."}
                    </p>
                  </div>
                </div>
              </section>

              {/* Active Initiatives */}
              {initiatives && initiatives.length > 0 && (
                <section>
                  <h2 className="font-display text-2xl font-semibold text-primary">
                    Active Initiatives
                  </h2>
                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    {initiatives.map((i) => (
                      <InitiativeCard key={i.id} initiative={i} />
                    ))}
                  </div>
                </section>
              )}

              {/* Transparency Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-primary" />
                  <h2 className="font-display text-2xl font-semibold text-primary">Transparency</h2>
                </div>
                <div className="rounded-[2rem] border border-border/40 bg-card p-8">
                  <p className="text-primary/80">
                    {organization.transparency_content ||
                      "This organization is committed to full transparency. Quarterly reports will be posted here."}
                  </p>
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-[2.5rem] border border-border/40 bg-card p-8 shadow-2xl shadow-primary/5">
                <div className="mb-8 flex items-center justify-between">
                  <div className="rounded-full bg-forest/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-forest">
                    Monthly Support
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
                        Rs {Number(organization.current_collected_amount || 0).toLocaleString()}
                      </span>
                      <span className="mt-1 block text-xs font-medium text-muted-foreground">
                        monthly target: Rs{" "}
                        {Number(organization.monthly_target_amount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="block text-2xl font-bold text-forest">
                        {Math.round(progress)}%
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Target
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
                        {organization.supporters_count || 0}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Supporters
                      </span>
                    </div>
                    <div className="rounded-2xl bg-muted/30 p-5 text-center">
                      <MessageSquare className="mx-auto mb-2 h-5 w-5 text-primary/40" />
                      <span className="block text-xl font-bold text-primary">
                        {organization.updates_feed_enabled ? "Active" : "Off"}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Updates
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <Link
                    to="/signup"
                    className="flex w-full items-center justify-center rounded-full bg-primary py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl active:scale-[0.98]"
                  >
                    Enable Monthly Support
                  </Link>
                  <p className="px-4 text-center text-[10px] leading-relaxed text-muted-foreground">
                    Joining as a monthly supporter provides stable funding for this organization's
                    operations and long-term goals.
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
