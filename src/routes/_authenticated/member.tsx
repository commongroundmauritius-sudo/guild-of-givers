import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo } from "react";

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getJoinedField } from "@/lib/utils";
import { toggleInitiativePreference } from "@/lib/auth-actions";
import {
  Check,
  Plus,
  FileText,
  ExternalLink,
  Heart,
  CreditCard,
  LayoutDashboard,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/member")({
  component: MemberDashboard,
});

function MemberDashboard() {
  const queryKeys = useMemo(() => [["all-initiatives"]], []);
  useRealtimeSync("initiatives", queryKeys);
  const { user, profile, isSubscribed, signOut } = useAuth();
  const { role, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  useEffect(() => {
    if (!authLoading && role && role !== "member") {
      toast.error("Unauthorized: Member access required");
      navigate({ to: "/dashboard" });
    }
  }, [role, authLoading, navigate]);

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
      const { data } = await supabase
        .from("initiatives")
        .select("*, organizations!inner(name, status)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .eq("organizations.status", "active");
      return data;
    },
  });

  const { data: approvedReports } = useQuery({
    queryKey: ["member-approved-reports", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*, initiatives(title), organizations(name)")
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

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Member";

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-teal-700">
                  {isSubscribed ? "Active Member" : "Guest Account"}
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-teal-600 sm:text-5xl">
                Welcome, {displayName}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Your monthly contribution overview and impact.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/member/profile"
                className="rounded-full border border-teal-600/20 bg-card px-5 py-2.5 text-sm font-semibold text-teal-700 hover:bg-teal-50 transition-colors"
              >
                My Profile
              </Link>
              <button
                onClick={() => signOut().then(() => navigate({ to: "/login" }))}
                className="rounded-full border border-input bg-background px-5 py-2.5 text-sm font-semibold hover:bg-muted transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Monthly contribution",
                value: subscription
                  ? `Rs ${Number(subscription.amount_mur).toLocaleString()}`
                  : "—",
                sub: subscription?.status || "Inactive",
                icon: CreditCard,
              },
              { title: "Active allocations", value: preferences?.length || 0, icon: Heart },
              {
                title: "Lifetime impact",
                value: `Rs ${lifetimeImpact.toLocaleString()}`,
                icon: LayoutDashboard,
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl border border-teal-600/20 bg-card p-6 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-teal-100 text-teal-600">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <p className="text-sm text-teal-600 font-bold uppercase tracking-wider">
                    {c.title}
                  </p>
                </div>
                <p className="mt-4 font-display text-3xl font-bold text-primary">{c.value}</p>
                {"sub" in c && (
                  <p className="mt-1 text-xs text-muted-foreground capitalize">{c.sub}</p>
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
                        ? "border-teal-600 bg-teal-600/5 shadow-sm"
                        : "border-border/40 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                          {getJoinedField(i.organizations, "name")}
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
                            ? "bg-teal-600 text-white"
                            : "bg-muted text-muted-foreground hover:bg-teal-100"
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
                      className="flex items-center justify-between rounded-2xl border border-teal-600/20 bg-card p-4 transition hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        <div className="grid h-10 w-10 place-items-center rounded-full bg-teal-100 text-teal-600">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {getJoinedField(r.initiatives, "title")} •{" "}
                            {getJoinedField(r.organizations, "name")}
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
                  <p className="text-sm text-muted-foreground italic">
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
                        <th className="px-6 py-4 font-medium uppercase text-[10px]">Date</th>
                        <th className="px-6 py-4 font-medium uppercase text-[10px]">Amount</th>
                        <th className="px-6 py-4 font-medium uppercase text-[10px]">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {payments.map((p) => (
                        <tr key={p.id}>
                          <td className="px-6 py-4 text-xs">
                            {new Date(p.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 font-bold">
                            Rs {Number(p.amount_mur).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                p.status === "success"
                                  ? "bg-forest-soft/10 text-forest-soft"
                                  : "bg-amber-500/10 text-amber-500"
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-muted-foreground italic">
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
