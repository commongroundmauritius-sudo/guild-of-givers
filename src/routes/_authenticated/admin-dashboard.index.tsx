import { getJoinedField } from "@/lib/utils";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { History, LayoutDashboard, Heart, Shield, User, FileText, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin-dashboard/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [init, ngos, members, reports] = await Promise.all([
        supabase.from("initiatives").select("id", { count: "exact", head: true }),
        supabase.from("ngos").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "member"),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);
      return {
        initiatives: init.count || 0,
        pendingNgos: ngos.count || 0,
        members: members.count || 0,
        pendingReports: reports.count || 0,
      };
    },
  });

  const { data: adminActions, isLoading: actionsLoading } = useQuery({
    queryKey: ["admin-actions"],
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
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*, ngos(name)")
        .eq("status", "pending")
        .limit(5);
      return data;
    },
  });

  const { data: recentEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ["webhook-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data;
    },
  });

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ["membership-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data;
    },
  });

  const moderateReport = async (reportId: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("reports").update({ status }).eq("id", reportId);

    if (error) toast.error("Failed to update report");
    else {
      toast.success(`Report ${status}`);
      queryClient.invalidateQueries({ queryKey: ["pending-reports"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    }
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Admin";

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                  System Admin
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary sm:text-5xl">
                Welcome back, {displayName}
              </h1>
              <p className="mt-2 text-muted-foreground">Global platform overview and moderation.</p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/admin-dashboard/profile"
                className="rounded-full border border-border/60 bg-card px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
              >
                View Profile
              </Link>
              <button
                onClick={() => signOut().then(() => navigate({ to: "/login" }))}
                className="rounded-full bg-red-50 border border-red-100 px-5 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Total Initiatives",
                value: stats?.initiatives ?? "0",
                icon: Heart,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
              {
                label: "Pending NGOs",
                value: stats?.pendingNgos ?? "0",
                icon: Shield,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "Total Members",
                value: stats?.members ?? "0",
                icon: User,
                color: "text-teal-600",
                bg: "bg-teal-50",
              },
              {
                label: "Pending Reports",
                value: stats?.pendingReports ?? "0",
                icon: FileText,
                color: "text-forest-soft",
                bg: "bg-green-50",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm"
              >
                <div
                  className={`grid h-10 w-10 place-items-center rounded-2xl ${stat.bg} ${stat.color}`}
                >
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="mt-4 text-sm font-medium text-muted-foreground">{stat.label}</p>
                <div className="mt-1">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-12" />
                  ) : (
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold text-primary">
                  Recent Activity
                </h2>
                <Link
                  to="/admin-dashboard/profile"
                  className="text-xs font-bold text-amber-600 uppercase hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border/40 bg-card">
                {actionsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : adminActions && adminActions.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {adminActions.map((action) => (
                      <div key={action.id} className="p-6 transition hover:bg-muted/50">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex gap-4">
                            <div className="mt-1 grid h-8 w-8 place-items-center rounded-full bg-amber-500/10 text-amber-500">
                              <History className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-primary capitalize">
                                {action.action_type.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(action.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                            {action.target_type}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground italic">
                    No activity logged yet.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="mb-6 font-display text-2xl font-semibold text-primary">
                Pending Moderation
              </h2>
              <div className="overflow-hidden rounded-3xl border border-border/40 bg-card">
                {reportsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : pendingReports && pendingReports.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-medium uppercase text-[10px]">Title</th>
                        <th className="px-6 py-4 font-medium uppercase text-[10px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {pendingReports.map((r) => (
                        <tr key={r.id}>
                          <td className="px-6 py-4">
                            <p className="font-medium text-primary">{r.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {getJoinedField(r.ngos, "name")}
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => moderateReport(r.id, "approved")}
                                className="text-xs font-bold text-forest-soft hover:underline"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => moderateReport(r.id, "rejected")}
                                className="text-xs font-bold text-red-500 hover:underline"
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
                    No pending reports.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="mb-6 font-display text-2xl font-semibold text-primary">
                Payment Webhooks
              </h2>
              <div className="overflow-hidden rounded-3xl border border-border/40 bg-card">
                {eventsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-8 w-full rounded-full" />
                    ))}
                  </div>
                ) : recentEvents && recentEvents.length > 0 ? (
                  <div className="divide-y divide-border/40 font-mono text-[11px]">
                    {recentEvents.map((e) => (
                      <div key={e.id} className="flex items-center justify-between p-4">
                        <div className="flex flex-col">
                          <span className="text-primary">{e.event_type}</span>
                          <span className="text-muted-foreground">
                            {new Date(e.created_at).toLocaleString()}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 font-bold uppercase text-[9px] ${
                            e.processing_status === "processed"
                              ? "bg-forest-soft/10 text-forest-soft"
                              : "bg-amber-500/10 text-amber-500"
                          }`}
                        >
                          {e.processing_status}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground italic">
                    No events found.
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl font-semibold text-primary">New Leads</h2>
                <Link
                  to="/admin-dashboard/leads"
                  className="text-xs font-bold text-amber-600 uppercase hover:underline"
                >
                  View All
                </Link>
              </div>
              <div className="overflow-hidden rounded-3xl border border-border/40 bg-card">
                {leadsLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : leads && leads.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {leads.map((l: unknown) => (
                      <div key={l.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-primary">{l.full_name}</p>
                          <p className="text-[11px] text-muted-foreground">{l.email}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-teal-600">
                            Rs {Number(l.amount_mur).toLocaleString()}
                          </p>
                          <span className="text-[9px] font-bold uppercase text-muted-foreground">
                            {l.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center text-muted-foreground italic">
                    No leads captured.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
