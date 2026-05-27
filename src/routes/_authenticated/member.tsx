import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Tables } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Heart,
  Target,
  TrendingUp,
  ChevronRight,
  Zap,
  Loader2,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/_authenticated/member")({
  component: MemberDashboard,
});

interface SubscriptionWithOrg extends Tables<"subscriptions"> {
  organizations: (Tables<"organizations"> & { initiatives: Tables<"initiatives">[] }) | null;
}

interface AllocationWithInitiative extends Tables<"allocations"> {
  initiatives: Tables<"initiatives"> | null;
}

function MemberDashboard() {
  const { user } = useAuth();

  const { data: memberData, isLoading, error } = useQuery({
    queryKey: ["member-dashboard-data", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      // Get subscriptions and joined organization details, including initiatives for that organization
      const { data: subscriptions, error: subError } = await supabase
        .from("subscriptions")
        .select(`
          *,
          organizations (*, initiatives (*))
        `)
        .eq("user_id", user!.id)
        .eq("status", "active");

      if (subError) throw subError;

      // Get recent allocations for this user
      const { data: allocations, error: allocError } = await supabase
        .from("allocations")
        .select(`
          *,
          initiatives (*),
          payments!inner (user_id)
        `)
        .eq("payments.user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (allocError) throw allocError;

      const totalMonthlyContribution = (subscriptions || [])?.reduce((sum, sub) => sum + (Number(sub.amount_mur) || 0), 0) || 0;

      return {
        subscriptions: (subscriptions || []) as unknown as SubscriptionWithOrg[],
        allocations: (allocations || []) as unknown as AllocationWithInitiative[],
        totalMonthlyContribution,
        impactCount: subscriptions?.length || 0
      };
    }
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="mt-4 text-muted-foreground">Loading your impact dashboard...</p>
        </div>
      </SiteLayout>
    );
  }

  if (error) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-4xl px-4 py-20 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 text-2xl font-bold">Failed to load dashboard</h1>
          <p className="mt-2 text-muted-foreground">There was an error retrieving your data.</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="min-h-screen bg-cream-soft/30 font-inter">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="mb-12 flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl font-bold text-primary">Welcome back</h1>
              <p className="mt-2 text-muted-foreground">Tracking your impact across Mauritius</p>
            </div>
            <div className="flex items-center gap-4 rounded-3xl bg-white p-2 shadow-sm border border-border/40">
              <div className="rounded-2xl bg-amber-500 px-6 py-3 text-center text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Monthly Impact</p>
                <p className="text-xl font-bold">Rs {memberData?.totalMonthlyContribution.toLocaleString()}</p>
              </div>
              <div className="px-6 py-3 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Initiatives</p>
                <p className="text-xl font-bold text-primary">{memberData?.impactCount}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <section>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-primary">Your Activity</h2>
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>

                <div className="grid gap-6 sm:grid-cols-2">
                  {memberData?.subscriptions?.map((sub) => {
                    const org = sub.organizations;
                    // For display, we might pick the primary initiative of the organization
                    const initiative = org?.initiatives?.[0];
                    if (!initiative) return null;

                    const progress = initiative.goal_amount_mur ? (Number(initiative.current_amount_mur) / Number(initiative.goal_amount_mur)) * 100 : 0;

                    return (
                      <div key={sub.id} className="rounded-[2rem] border border-border/40 bg-card p-6 shadow-sm transition hover:shadow-md">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-[10px] font-bold text-teal-600 uppercase">
                            Impact
                          </span>
                          <span className="text-xs font-bold text-primary">Rs {Number(sub.amount_mur).toLocaleString()}/mo</span>
                        </div>
                        <h3 className="font-display text-lg font-bold text-primary mb-2">{initiative.title}</h3>
                        <div className="mt-6 space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                            <span>Progress</span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {memberData?.subscriptions?.length === 0 && (
                  <div className="rounded-[3rem] border-2 border-dashed border-border/40 py-24 text-center">
                    <Heart className="mx-auto h-12 w-12 text-muted-foreground/30" />
                    <h3 className="mt-4 text-xl font-bold text-primary">Start your impact journey</h3>
                    <p className="mt-2 text-muted-foreground">You haven't backed any initiatives yet.</p>
                    <Link to="/initiatives" className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-bold text-white transition hover:bg-primary/90">
                      Explore Initiatives
                    </Link>
                  </div>
                )}
              </section>

              <section className="rounded-[2.5rem] bg-forest text-white p-10 shadow-xl overflow-hidden relative">
                <div className="relative z-10">
                  <h2 className="font-display text-3xl font-bold mb-4">Transparent Giving</h2>
                  <p className="text-forest-light leading-relaxed mb-8 max-w-md">
                    Every rupee you contribute is tracked. We ensure your funds reach the verified projects you choose to support.
                  </p>
                  <Link to="/initiatives" className="inline-flex items-center gap-2 font-bold text-amber-400 hover:text-amber-300 transition">
                    Explore more projects <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              </section>
            </div>

            <div className="space-y-8">
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h3 className="font-display text-xl font-bold mb-6">Recent Allocations</h3>
                <div className="space-y-6">
                  {memberData?.allocations?.map((alloc) => {
                    const initiative = alloc.initiatives;
                    return (
                      <div key={alloc.id} className="flex gap-4">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">
                            Allocated Rs {Number(alloc.amount_mur).toLocaleString()}
                          </p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            to {initiative?.title || "Initiative"} • {format(new Date(alloc.created_at), 'MMM d')}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {memberData?.allocations?.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
