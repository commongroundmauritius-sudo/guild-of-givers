import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

          <div className="mt-12 grid gap-6 md:grid-cols-3">
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
        </div>
      </section>
    </SiteLayout>
  );
}
