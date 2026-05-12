import { createFileRoute } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { signOut } = useAuth();

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

  const toggleVetting = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("ngos")
      .update({ is_verified: !currentStatus })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update vetting status");
    } else {
      toast.success("NGO status updated");
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
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary sm:text-5xl">
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
              <div key={c.title} className="rounded-3xl border border-border/40 bg-card p-6">
                <p className="text-sm text-muted-foreground">{c.title}</p>
                <p className="mt-3 font-display text-3xl text-primary">{c.value}</p>
              </div>
            ))}

            <div className="lg:col-span-3 rounded-3xl border border-border/40 bg-card p-6">
              <h3 className="text-sm font-medium text-muted-foreground mb-6">Treasury Flow</h3>
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
                        <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.5} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="var(--color-primary)"
                      fillOpacity={1}
                      fill="url(#colorAmount)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-primary">
              Recent Transactions
            </h2>
            <div className="mt-6 overflow-hidden rounded-3xl border border-border/40 bg-card">
              {recentPayments && recentPayments.length > 0 ? (
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-6 py-4 font-medium">Date</th>
                      <th className="px-6 py-4 font-medium">Member</th>
                      <th className="px-6 py-4 font-medium">Amount</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {recentPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-6 py-4">{new Date(p.created_at).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                          {(p.profiles as unknown as { full_name: string })?.full_name || "Unknown"}
                        </td>
                        <td className="px-6 py-4">Rs {Number(p.amount_mur).toLocaleString()}</td>
                        <td className="px-6 py-4 capitalize">{p.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">
                  No recent transactions found.
                </div>
              )}
            </div>
          </div>

          <div className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-primary">Vetting Management</h2>
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
                          <button
                            onClick={() => toggleVetting(ngo.id, ngo.is_verified)}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            {ngo.is_verified ? "Revoke Vetting" : "Approve NGO"}
                          </button>
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

          <div className="mt-12">
            <h2 className="font-display text-2xl font-semibold text-primary">Payment Audit Log</h2>
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
                              e.processed
                                ? "bg-forest-soft/10 text-forest-soft"
                                : "bg-amber-500/10 text-amber-500"
                            }`}
                          >
                            {e.processed ? "Processed" : "Pending"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-muted-foreground">No recent events found.</div>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
