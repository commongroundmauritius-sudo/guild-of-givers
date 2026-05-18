import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Heart,
  Share2,
  ShieldCheck,
  Globe,
  Target,
  BarChart3,
  FileText,
  MessageSquare,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const Route = createFileRoute("/entities/$id")({
  component: EntityProfilePage,
});

function EntityProfilePage() {
  const { id } = Route.useParams();

  const {
    data: organization,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["organization-entity", id],
    queryFn: async () => {
      if (!id) throw new Error("No Entity ID provided");
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: initiatives } = useQuery({
    queryKey: ["organization-initiatives", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .eq("organization_id", id)
        .eq("is_approved", true)
        .eq("is_published", true);
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-20">
          <Skeleton className="h-[400px] w-full rounded-[3rem]" />
        </div>
      </SiteLayout>
    );
  }

  if (error || !organization) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
          <h1 className="text-2xl font-bold text-primary">Entity not found</h1>
          <Link to="/initiatives" className="mt-4 text-forest hover:underline">
            Back to Initiatives
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const progress =
    organization.monthly_target_amount && organization.monthly_target_amount > 0
      ? (Number(organization.current_collected_amount || 0) /
          Number(organization.monthly_target_amount)) *
        100
      : 0;

  return (
    <SiteLayout>
      <article className="min-h-screen bg-cream-soft/30 font-inter pb-20">
        {/* Hero Section */}
        <div className="relative h-[40vh] min-h-[400px] w-full overflow-hidden bg-primary/5">
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="h-32 w-32 overflow-hidden rounded-full border-4 border-white bg-white shadow-xl">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.organization_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-4xl font-bold text-primary uppercase">
                  {organization.organization_name.charAt(0)}
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 sm:p-12">
            <div className="mx-auto max-w-7xl">
              <Link
                to="/initiatives"
                className="inline-flex items-center gap-2 rounded-full bg-black/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-md transition hover:bg-black/20"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
              <h1 className="mt-6 font-display text-4xl font-bold text-primary sm:text-5xl lg:text-6xl">
                {organization.organization_name}
              </h1>
              <div className="mt-4 flex flex-wrap gap-4">
                <span className="rounded-full bg-forest/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-forest">
                  {organization.category || "Social Entity"}
                </span>
                {organization.is_verified && (
                  <span className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-blue-600">
                    <ShieldCheck className="h-3.5 w-3.5" /> Vetted Partner
                  </span>
                )}
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
                      <Link
                        key={i.id}
                        to="/initiatives/$id"
                        params={{ id: i.id }}
                        className="group overflow-hidden rounded-[2rem] border border-border/40 bg-card transition hover:border-primary/40"
                      >
                        <div className="aspect-video bg-muted">
                          {i.image_url && (
                            <img
                              src={i.image_url}
                              alt={i.title}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="font-display text-lg font-bold text-primary group-hover:text-forest transition">
                            {i.title}
                          </h3>
                          <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                            {i.summary || i.caption}
                          </p>
                        </div>
                      </Link>
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
