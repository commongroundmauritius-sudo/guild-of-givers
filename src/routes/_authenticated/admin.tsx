import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { History, ShieldCheck, AlertTriangle, User, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const { data: leads } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      return data;
    },
  });

  const { data: membersCount } = useQuery({
    queryKey: ["admin-members-count"],
    queryFn: async () => {
      const { count } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      return count ?? 0;
    },
  });

  const { data: totalPayments } = useQuery({
    queryKey: ["admin-total-payments"],
    queryFn: async () => {
      const { data } = await supabase.from("payments").select("amount_mur").eq("status", "success");
      return data?.reduce((acc, p) => acc + Number(p.amount_mur), 0) ?? 0;
    },
  });

  const { data: recentPayments } = useQuery({
    queryKey: ["admin-recent-payments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*, profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(10);
      return data;
    },
  });

  const { data: pendingReports, refetch: refetchReports } = useQuery({
    queryKey: ["admin-pending-reports"],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*, ngos(name), initiatives(title)")
        .eq("status", "pending_review")
        .order("created_at", { ascending: false });
      return data;
    },
  });

  const { data: recentEvents } = useQuery({
    queryKey: ["admin-recent-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data;
    },
  });

  const { data: ngos, refetch: refetchNgos } = useQuery({
    queryKey: ["admin-ngos"],
    queryFn: async () => {
      const { data } = await supabase.from("ngos").select("*").order("name");
      return data;
    },
  });

  const { data: adminActions, refetch: refetchActions } = useQuery({
    queryKey: ["admin-actions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_actions")
        .select("*, profiles:admin_id(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(30);
      return data;
    },
  });

  const logAction = async (
    type: string,
    targetId: string,
    targetType: string,
    details: any = {},
  ) => {
    if (!user?.id) return;
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: type,
      target_id: targetId,
      target_type: targetType,
      details,
    });
    refetchActions();
  };

  const toggleVetting = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ngos")
      .update({ is_verified: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update vetting status");
    } else {
      toast.success("NGO vetting updated");
      logAction(currentStatus ? "revoke_vetting" : "approve_ngo", id, "ngo");
      refetchNgos();
      refetchInitiatives();
    }
  };

  const { data: adminInitiatives, refetch: refetchInitiatives } = useQuery({
    queryKey: ["admin-all-initiatives"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, ngos(name)")
        .order("created_at", { ascending: false });
      return data;
    },
  });

  const toggleInitiativeApproval = async (id: string, current: boolean) => {
    const { error } = await supabase
      .from("initiatives")
      .update({ is_approved: !current })
      .eq("id", id);

    if (error) toast.error("Failed to update initiative approval");
    else {
      toast.success("Initiative approval updated");
      logAction(current ? "revoke_initiative_approval" : "approve_initiative", id, "initiative");
      refetchInitiatives();
      if (!current) {
        navigate({ to: "/admin-dashboard/initiatives/$id/manage", params: { id } });
      }
    }
  };

  const moderateReport = async (id: string, status: "approved" | "rejected") => {
    const { error } = await supabase.from("reports").update({ status }).eq("id", id);
    if (error) toast.error("Failed to update report");
    else {
      toast.success(`Report ${status}`);
      logAction(`moderate_report_${status}`, id, "report");
      refetchReports();
    }
  };

  const toggleSuspension = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended";
    const { error } = await supabase.from("ngos").update({ status: newStatus }).eq("id", id);
    if (error) toast.error("Failed to update suspension status");
    else {
      toast.success(`NGO ${newStatus === "suspended" ? "suspended" : "activated"}`);
      logAction(newStatus === "suspended" ? "suspend_ngo" : "activate_ngo", id, "ngo");
      refetchNgos();
    }
  };

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="kicker">Admin</span>
              <h1 className="mt-3 font-display text-4xl font-semibold text-amber-500 sm:text-5xl">
                Platform Admin
              </h1>
              <p className="mt-2 text-muted-foreground">
                Govern members, NGOs, vetting and treasury.
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-full border border-input bg-background px-5 py-2.5 text-sm hover:bg-muted"
            >
              Sign out
            </button>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {[
              { title: "Total Members", value: membersCount ?? 0 },
              { title: "Total Treasury", value: `Rs ${totalPayments?.toLocaleString()}` },
              { title: "Platform Health", value: "Optimal" },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6"
              >
                <p className="text-sm font-medium text-amber-500">{c.title}</p>
                <p className="mt-3 font-display text-3xl text-amber-500">{c.value}</p>
              </div>
            ))}

            <div className="rounded-3xl border border-border/40 bg-card p-6 lg:col-span-3">
              <h3 className="mb-6 text-sm font-medium text-muted-foreground">Treasury Flow</h3>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={
                      recentPayments
                        ?.map((p) => ({
                          date: new Date(p.created_at).toLocaleDateString(),
                          amount: Number(p.amount_mur),
                        }))
                        .reverse() || []
                    }
                  >
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F2994A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#F2994A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" hide />
                    <YAxis hide />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#F2994A"
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-amber-500">
                Initiative Approvals
              </h2>
              <div className="mt-6 overflow-hidden rounded-3xl border border-amber-500/20 bg-card">
                {adminInitiatives && adminInitiatives.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-500/10 text-amber-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">Initiative</th>
                        <th className="px-6 py-4 font-medium">NGO</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {adminInitiatives.map((i) => (
                        <tr key={i.id}>
                          <td className="px-6 py-4 font-medium">
                            <Link
                              to="/admin-dashboard/initiatives/$id/manage"
                              params={{ id: i.id }}
                              className="hover:underline"
                            >
                              {i.title}
                            </Link>
                          </td>
                          <td className="px-6 py-4">{(i.ngos as any)?.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`text-[10px] font-bold uppercase ${i.is_approved ? "text-forest-soft" : "text-amber-500"}`}
                              >
                                {i.is_approved ? "Approved" : "Pending"}
                              </span>
                              <span
                                className={`text-[10px] font-bold uppercase ${i.is_published ? "text-forest-soft" : "text-muted-foreground"}`}
                              >
                                {i.is_published ? "Published" : "Hidden"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-4">
                              <button
                                onClick={() => toggleInitiativeApproval(i.id, i.is_approved)}
                                className={`text-xs font-semibold hover:underline ${
                                  i.is_approved ? "text-amber-600" : "text-primary"
                                }`}
                              >
                                {i.is_approved ? "Revoke" : "Approve"}
                              </button>
                              <Link
                                to="/admin-dashboard/initiatives/$id/manage"
                                params={{ id: i.id }}
                                className="text-xs font-semibold text-primary hover:underline"
                              >
                                Manage
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No initiatives found.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-primary">
                Vetting Management
              </h2>
              <div className="mt-6 overflow-hidden rounded-3xl border border-border/40 bg-card">
                {ngos && ngos.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-medium">Organization</th>
                        <th className="px-6 py-4 font-medium">Category</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {ngos.map((ngo) => (
                        <tr key={ngo.id}>
                          <td className="px-6 py-4 font-medium">{ngo.name}</td>
                          <td className="px-6 py-4">{ngo.category}</td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs ${
                                ngo.is_verified
                                  ? "bg-forest-soft/10 text-forest-soft"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {ngo.is_verified ? "Verified" : "Pending Vetting"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-4">
                              <button
                                onClick={() => toggleVetting(ngo.id, ngo.is_verified)}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                {ngo.is_verified ? "Revoke Vetting" : "Approve NGO"}
                              </button>
                              <button
                                onClick={() => toggleSuspension(ngo.id, ngo.status || "active")}
                                className={`text-xs font-medium hover:underline ${
                                  ngo.status === "suspended" ? "text-forest-soft" : "text-red-500"
                                }`}
                              >
                                {ngo.status === "suspended" ? "Activate" : "Suspend"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">No NGOs registered.</div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-amber-500">
                Recent Admin Activity
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Audited history of administrative actions.
              </p>
              <div className="mt-6 overflow-hidden rounded-3xl border border-amber-500/20 bg-card">
                {adminActions && adminActions.length > 0 ? (
                  <div className="divide-y divide-border/40">
                    {adminActions.map((action) => (
                      <div key={action.id} className="p-6 transition hover:bg-amber-500/5">
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
                                By{" "}
                                {action.profiles?.full_name ||
                                  action.profiles?.email ||
                                  "Unknown Admin"}
                              </p>
                              <p className="mt-1 text-[10px] font-mono text-muted-foreground uppercase">
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
                  <div className="p-12 text-center text-muted-foreground">
                    No activity logged yet.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-amber-500">
                Report Moderation
              </h2>
              <div className="mt-6 overflow-hidden rounded-3xl border border-amber-500/20 bg-card">
                {pendingReports && pendingReports.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-500/10 text-amber-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">NGO / Initiative</th>
                        <th className="px-6 py-4 font-medium">Title</th>
                        <th className="px-6 py-4 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {pendingReports.map((r) => (
                        <tr key={r.id}>
                          <td className="px-6 py-4">
                            <p className="font-medium">{(r.ngos as any)?.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {(r.initiatives as any)?.title}
                            </p>
                          </td>
                          <td className="px-6 py-4">{r.title}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3">
                              <button
                                onClick={() => moderateReport(r.id, "approved")}
                                className="text-xs font-semibold text-forest-soft hover:underline"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => moderateReport(r.id, "rejected")}
                                className="text-xs font-semibold text-red-500 hover:underline"
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
                  <div className="p-12 text-center text-muted-foreground">
                    No pending reports to review.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-primary">
                Payment Audit Log
              </h2>
              <div className="mt-6 overflow-hidden rounded-3xl border border-border/40 bg-card">
                {recentEvents && recentEvents.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-medium">Time</th>
                        <th className="px-6 py-4 font-medium">Event Type</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40 font-mono text-[11px]">
                      {recentEvents.map((e) => (
                        <tr key={e.id}>
                          <td className="px-6 py-3">{new Date(e.created_at).toLocaleString()}</td>
                          <td className="px-6 py-3">{e.event_type}</td>
                          <td className="px-6 py-3">
                            <span
                              className={`rounded-full px-2 py-0.5 ${
                                e.processing_status === "processed"
                                  ? "bg-forest-soft/10 text-forest-soft"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {e.processing_status === "processed" ? "Processed" : "Pending"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No recent events found.
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-amber-500">
                Membership Leads
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Potential members who started the flow but haven't necessarily converted.
              </p>
              <div className="mt-6 overflow-hidden rounded-3xl border border-amber-500/20 bg-card">
                {leads && leads.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-amber-500/10 text-amber-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Details</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {leads.map((l: any) => (
                        <tr key={l.id}>
                          <td className="px-6 py-4 text-xs">
                            {new Date(l.created_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <p className="font-medium">{l.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {l.email} • {l.phone || "No phone"}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-xs">
                            Rs {Number(l.amount_mur).toLocaleString()}
                            {l.covers_fees && (
                              <span className="ml-1 uppercase font-bold text-[10px] text-forest-soft">
                                + Fee
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                                l.status === "converted"
                                  ? "bg-forest-soft/10 text-forest-soft"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No leads captured yet.
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
