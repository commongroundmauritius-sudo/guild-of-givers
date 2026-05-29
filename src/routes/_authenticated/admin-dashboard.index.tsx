import { getJoinedField } from "@/lib/utils";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  History,
  LayoutDashboard,
  Heart,
  Shield,
  User,
  FileText,
  Users,
  MousePointer2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin-dashboard/")({
  component: AdminDashboard,
});

function AdminDashboard() {
    const { user, profile, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && role !== 'admin') {
      navigate({ to: '/dashboard' });
    }
  }, [loading, role, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const [init, initPending, organizations, members, reports, leads] = await Promise.all([
        supabase.from("initiatives").select("id", { count: "exact", head: true }),
        supabase
          .from("initiatives")
          .select("id", { count: "exact", head: true })
          .eq("is_approved", false),
        supabase
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_review"),
        supabase
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "member"),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_review"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "started"),
      ]);
      return {
        initiatives: init.count || 0,
        awaitingReviewOrgs: organizations.count || 0,
        members: members.count || 0,
        pendingReports: reports.count || 0,
        pendingInitiatives: initPending.count || 0,
        activeLeads: leads.count || 0,
      };
    },
  });

  const { data: adminActions, isLoading: actionsLoading } = useQuery({
    queryKey: ["admin-actions"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data;
    },
  });

  const { data: pendingReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["pending-reports"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*, organizations(organization_name)")
        .eq("status", "pending_review")
        .limit(5);
      return data;
    },
  });

  const { data: recentEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["webhook-events"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data;
    },
  });

  const { data: pendingVersions, isLoading: versionsLoading } = useQuery({
    queryKey: ["pending-initiative-versions"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase
        .from("initiative_versions")
        .select("*, initiatives(title, organizations(organization_name))")
        .eq("status", "pending")
        .limit(5);
      return data;
    },
  });

  const approveReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("reports")
        .update({ status: "approved" })
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report approved");
      queryClient.invalidateQueries({ queryKey: ["pending-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  const rejectReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { error } = await supabase
        .from("reports")
        .update({ status: "rejected" })
        .eq("id", reportId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report rejected");
      queryClient.invalidateQueries({ queryKey: ["pending-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-bold text-primary">Admin Control</h1>
          <p className="mt-2 text-muted-foreground">Platform overview and management.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/admin-dashboard/leads"
            className="flex items-center gap-2 rounded-full bg-primary/5 px-5 py-2.5 text-sm font-bold text-primary hover:bg-primary/10 transition"
          >
            Lead CRM
          </Link>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array(4)
            .fill(0)
            .map((_, i) => <Skeleton key={i} className="h-32 rounded-3xl" />)
        ) : (
          <>
            <StatCard
              title="Active Members"
              value={stats?.members || 0}
              icon={<Users className="h-6 w-6 text-primary" />}
              trend="Total acquired"
            />
            <StatCard
              title="Active Leads"
              value={stats?.activeLeads || 0}
              icon={<MousePointer2 className="h-6 w-6 text-blue-500" />}
              trend="In onboarding"
            />
            <StatCard
              title="Initiatives"
              value={stats?.initiatives || 0}
              icon={<Heart className="h-6 w-6 text-rose-500" />}
              trend={`${stats?.pendingInitiatives} pending review`}
            />
            <StatCard
              title="Awaiting Org Review"
              value={stats?.awaitingReviewOrgs || 0}
              icon={<Shield className="h-6 w-6 text-amber-500" />}
              trend="Compliance queue"
            />
          </>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Pending Reports */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-primary">Pending Reports</h2>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
              {stats?.pendingReports || 0} Action Required
            </span>
          </div>
          <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card">
            {reportsLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : pendingReports && pendingReports.length > 0 ? (
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-border/40">
                  {pendingReports.map((report) => (
                    <tr key={report.id} className="group">
                      <td className="px-6 py-5">
                        <div className="font-bold text-primary">{report.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {getJoinedField(report.organizations, "organization_name")}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                          <button
                            onClick={() => approveReportMutation.mutate(report.id)}
                            className="rounded-lg bg-forest/10 px-3 py-1.5 text-xs font-bold text-forest hover:bg-forest/20"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => rejectReportMutation.mutate(report.id)}
                            className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-muted-foreground italic">
                No reports awaiting review.
              </div>
            )}
          </div>
        </div>

        {/* Recent Admin Actions */}
        <div className="space-y-6">
          <h2 className="font-display text-2xl font-bold text-primary">Audit Log</h2>
          <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card">
            {actionsLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : adminActions && adminActions.length > 0 ? (
              <div className="divide-y divide-border/40">
                {adminActions.map((action) => (
                  <div key={action.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="mt-1 rounded-full bg-muted p-2">
                      <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-primary">{action.action_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(action.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-muted-foreground italic">
                No recent actions recorded.
              </div>
            )}
          </div>
        </div>
      </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function StatCard({
  title,
  value,
  icon,
  trend,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend: string;
}) {
  return (
    <div className="rounded-[2rem] border border-border/40 bg-card p-8 shadow-sm transition hover:border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-2xl bg-muted/40 p-3">{icon}</div>
      </div>
      <div>
        <span className="text-4xl font-bold tracking-tight text-primary">{value}</span>
        <div className="mt-2 flex flex-col">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          <span className="mt-1 text-[10px] font-medium text-primary/60">{trend}</span>
        </div>
      </div>
    </div>
  );
}
