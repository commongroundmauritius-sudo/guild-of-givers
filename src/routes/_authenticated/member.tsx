import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Heart,
  LayoutDashboard,
  Check,
  Plus,
  FileText,
  ExternalLink,
  History
} from "lucide-react";
import { Link, useNavigate, createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { AllocationPreview } from "@/components/member/AllocationPreview";

export const Route = createFileRoute("/_authenticated/member")({
  component: MemberDashboard,
});

export default function MemberDashboard() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: subscription } = useQuery({
    queryKey: ["member-subscription", user?.id],
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

  const { data: ledgerEvents } = useQuery({
    queryKey: ["member-ledger", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_events")
        .select("*, initiatives(title)")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: initiatives } = useQuery({
    queryKey: ["public-initiatives"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, organizations(organization_name)")
        .eq("is_approved", true)
        .eq("is_published", true)
        .eq("status", "active");
      return data;
    },
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
      if (selected) {
        return supabase.from("member_preferences").insert({
          user_id: user?.id,
          initiative_id: initiativeId,
          priority_level: (preferences?.length || 0) + 1
        });
      } else {
        return supabase
          .from("member_preferences")
          .delete()
          .eq("user_id", user?.id)
          .eq("initiative_id", initiativeId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-preferences", user?.id] });
      toast.success("Preferences updated");
    },
  });

  const isSubscribed = subscription?.status === "active";
  const lifetimeImpact = ledgerEvents
    ?.filter(e => e.event_type === 'allocation' || e.event_type === 'impact_pool')
    .reduce((acc, e) => acc + Number(e.amount_mur), 0) ?? 0;

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Member";

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge className={isSubscribed ? "bg-teal-100 text-teal-700" : "bg-muted text-muted-foreground"}>
                  {isSubscribed ? "Active Member" : "Guest Account"}
                </Badge>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-teal-600 sm:text-5xl">
                Welcome, {displayName}
              </h1>
              <p className="mt-2 text-muted-foreground font-medium">
                Your monthly contribution overview and real impact.
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
                color: "teal"
              },
              { title: "Active allocations", value: preferences?.length || 0, icon: Heart, color: "teal" },
              {
                title: "Lifetime impact",
                value: `Rs ${lifetimeImpact.toLocaleString()}`,
                sub: "Actual funds allocated",
                icon: LayoutDashboard,
                color: "teal"
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
                  <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wider">
                    {c.title}
                  </p>
                </div>
                <p className="mt-4 font-display text-3xl font-bold text-primary">{c.value}</p>
                {"sub" in c && (
                  <p className="mt-1 text-xs text-muted-foreground capitalize font-medium">{c.sub}</p>
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
                          {(i.organizations as any)?.organization_name}
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
              <h2 className="font-display text-2xl font-semibold text-teal-600 flex items-center gap-2">
                <History className="h-5 w-5" />
                Ledger History
              </h2>
              <p className="text-muted-foreground text-sm mt-1">Direct visibility into your fund movements.</p>
              <div className="mt-6 space-y-3">
                {ledgerEvents && ledgerEvents.length > 0 ? (
                  ledgerEvents.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-center justify-between rounded-2xl border border-teal-600/20 bg-card p-4 transition hover:shadow-md"
                    >
                      <div className="flex gap-4">
                        <div className={`grid h-10 w-10 place-items-center rounded-full ${e.event_type === 'allocation' ? 'bg-teal-100 text-teal-600' : 'bg-amber-100 text-amber-700'}`}>
                          <Heart className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary capitalize">{e.event_type.replace('_', ' ')}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                            {e.initiatives?.title || 'System Pool'} • {new Date(e.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <p className="font-display font-bold text-teal-600">Rs {Number(e.amount_mur).toLocaleString()}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic bg-card border border-border/40 p-12 rounded-3xl text-center">
                    No ledger activity recorded yet.
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="space-y-8">
                <AllocationPreview amount={Number(subscription?.amount_mur || 0)} userId={user?.id} />
                <div>
                  <h2 className="font-display text-2xl font-semibold text-primary">Membership Status</h2>
                  <div className="mt-6 p-8 rounded-3xl border border-border/40 bg-card">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-xs font-bold text-muted-foreground uppercase">Current Plan</p>
                        <p className="text-xl font-bold">{subscription ? `Rs ${Number(subscription.amount_mur).toLocaleString()} / mo` : 'None'}</p>
                      </div>
                      <Badge variant={isSubscribed ? "default" : "secondary"}>
                        {subscription?.status || 'Inactive'}
                      </Badge>
                    </div>
                    <div className="space-y-4 pt-6 border-t border-border/40">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Next Billing Date</span>
                        <span className="font-semibold">{subscription?.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Membership Since</span>
                        <span className="font-semibold">{subscription?.created_at ? new Date(subscription.created_at).toLocaleDateString() : '—'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
