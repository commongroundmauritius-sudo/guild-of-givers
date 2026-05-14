import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toggleInitiativePreference } from "@/lib/auth-actions";
import { toast } from "sonner";
import { Check, Plus, FileText, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/_authenticated/member")({
  component: MemberDashboard,
});

function MemberDashboard() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: payments } = useQuery({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: initiatives } = useQuery({
    queryKey: ["all-initiatives"],
    queryFn: async () => {
      // Filter for approved initiatives from active (not suspended) NGOs
      const { data } = await supabase
        .from("initiatives")
        .select("*, ngos!inner(name, status)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .eq("ngos.status", "active");
      return data;
    },
  });

  const { data: approvedReports } = useQuery({
    queryKey: ["member-approved-reports", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*, initiatives(title), ngos(name)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: preferences } = useQuery({
    queryKey: ["member-preferences", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("member_preferences")
        .select("initiative_id")
        .eq("user_id", user?.id);
      return data?.map((p) => p.initiative_id) || [];
    },
    enabled: !!user?.id,
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ initiativeId, selected }: { initiativeId: string; selected: boolean }) => {
      if (!user) return;
      return toggleInitiativePreference({
        data: {
          userId: user.id,
          initiativeId,
          selected,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-preferences", user?.id] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const lifetimeImpact =
    payments
      ?.filter((p) => p.status === "success")
      .reduce((acc, p) => acc + Number(p.amount_mur), 0) ?? 0;

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="kicker">Member</span>
              <h1 className="mt-3 font-display text-4xl font-semibold text-teal-600 sm:text-5xl">
                Welcome, {user?.email?.split("@")[0]}
              </h1>
              <p className="mt-2 text-muted-foreground">Your monthly contribution overview.</p>
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
              {
                title: "Monthly contribution",
                value: subscription
                  ? `Rs ${Number(subscription.amount_mur).toLocaleString()}`
                  : "—",
                sub:
                  subscription?.status === "pending"
                    ? "Verification pending"
                    : subscription?.status,
              },
              { title: "Active allocations", value: preferences?.length || 0 },
              { title: "Lifetime impact", value: `Rs ${lifetimeImpact.toLocaleString()}` },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl border border-teal-600/20 bg-teal-600/5 p-6"
              >
                <p className="text-sm text-teal-600 font-medium">{c.title}</p>
                <p className="mt-3 font-display text-3xl text-teal-600">{c.value}</p>
                {"sub" in c && c.sub && (
                  <p className="mt-1 text-xs text-teal-600/70 capitalize">{c.sub}</p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="font-display text-2xl font-semibold text-primary">
              Choose your initiatives
            </h2>
            <p className="mt-2 text-muted-foreground">
              Select the programs where you want your monthly contribution to be allocated.
            </p>

            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {initiatives?.map((i) => {
                const isSelected = preferences?.includes(i.id);
                return (
                  <div
                    key={i.id}
                    className={`relative overflow-hidden rounded-3xl border p-6 transition ${
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border/40 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-xs font-medium text-muted-foreground uppercase">
                          {(i.ngos as any)?.name}
                        </span>
                        <h3 className="mt-1 font-display text-lg font-semibold text-primary">
                          {i.title}
                        </h3>
                      </div>
                      <button
                        onClick={() =>
                          toggleMutation.mutate({ initiativeId: i.id, selected: !isSelected })
                        }
                        className={`grid h-8 w-8 place-items-center rounded-full transition ${
                          isSelected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-primary/20"
                        }`}
                      >
                        {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {i.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-teal-600">
                Transparency Updates
              </h2>
              <div className="mt-6 space-y-4">
                {approvedReports && approvedReports.length > 0 ? (
                  approvedReports.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between rounded-2xl border border-teal-600/20 bg-teal-600/5 p-4"
                    >
                      <div className="flex gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-600/10 text-teal-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-teal-600">{r.title}</p>
                          <p className="text-xs text-teal-600/70">
                            {(r.initiatives as any)?.title} • {(r.ngos as any)?.name}
                          </p>
                        </div>
                      </div>
                      <a
                        href={r.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-600 hover:text-teal-700"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No transparency reports available yet.
                  </p>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-primary">Payment History</h2>
              <div className="mt-6 overflow-hidden rounded-3xl border border-border/40 bg-card">
                {payments && payments.length > 0 ? (
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4 font-medium">Date</th>
                        <th className="px-6 py-4 font-medium">Amount</th>
                        <th className="px-6 py-4 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-6 py-4">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">Rs {Number(p.amount_mur).toLocaleString()}</td>
                          <td className="px-6 py-4 capitalize">{p.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground">
                    No payment history found.
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
