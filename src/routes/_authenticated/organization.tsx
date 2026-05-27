import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, TrendingUp, Calendar, ArrowRight, Heart, Settings } from "lucide-react";

export const Route = createFileRoute("/_authenticated/organization")({
  component: OrganizationDashboard,
});

function OrganizationDashboard() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user?.id ?? "")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: initiatives, isLoading } = useQuery({
    queryKey: ["org-initiatives", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .eq("organization_id", profile?.organization_id ?? "");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const totalViews = initiatives?.reduce((sum, i) => sum + (i.view_count || 0), 0) || 0;
  const totalMembers = initiatives?.reduce((sum, i) => sum + (i.conversion_count || 0), 0) || 0;
  const totalActive =
    initiatives?.reduce((sum, i) => sum + (i.active_supporter_count || 0), 0) || 0;
  const conversionRate = totalViews > 0 ? (totalMembers / totalViews) * 100 : 0;

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl font-bold text-primary">Organization Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor your initiatives and supporter engagement.
            </p>
          </div>
          <Link
            to="/organization"
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition"
          >
            <Settings className="h-4 w-4" /> Manage Profile
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <StatCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            icon={<Eye className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Members Acquired"
            value={totalMembers.toLocaleString()}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Active Supporters"
            value={totalActive.toLocaleString()}
            icon={<Heart className="h-5 w-5 text-forest" />}
          />
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate.toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
          />
        </div>

        <h2 className="font-display text-2xl font-bold text-primary mb-6">Your Initiatives</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? [1, 2, 3].map((idx) => <Skeleton key={idx} className="h-48 rounded-[2rem]" />)
            : initiatives?.map((initiative) => (
                <div
                  key={initiative.id}
                  className="rounded-[2rem] border border-border/40 bg-card p-8 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        initiative.is_published
                          ? "bg-forest/10 text-forest"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {initiative.is_published ? "Published" : "Draft"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(initiative.created_at), "MMM d, yyyy")}
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-primary mb-4 line-clamp-1">
                    {initiative.title}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Views
                      </span>
                      <p className="font-bold text-primary">{initiative.view_count || 0}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Members
                      </span>
                      <p className="font-bold text-primary">{initiative.conversion_count || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </SiteLayout>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/30">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      </div>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}

import { format } from "date-fns";
