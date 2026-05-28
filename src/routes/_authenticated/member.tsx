import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Heart,
  CreditCard,
  LayoutDashboard,
  History,
  Plus,
  Check,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { AllocationPreview } from "@/components/member/AllocationPreview";
import { getJoinedField } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/member")({
  component: MemberDashboard,
});

function MemberDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const subSyncKeys = useMemo(() => user?.id ? [["member-subscription", user.id]] : [], [user?.id]);
  const prefSyncKeys = useMemo(() => user?.id ? [["member-preferences", user.id]] : [], [user?.id]);
  const ledgerSyncKeys = useMemo(() => user?.id ? [["member-ledger", user.id]] : [], [user?.id]);

  useRealtimeSync("subscriptions", subSyncKeys);
  useRealtimeSync("member_preferences", prefSyncKeys);
  useRealtimeSync("financial_events", ledgerSyncKeys);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: subscription } = useQuery({
    queryKey: ["member-subscription", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: preferences } = useQuery({
    queryKey: ["member-preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("member_preferences")
        .select("initiative_id")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const { data: allInitiatives } = useQuery({
    queryKey: ["public-initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_visible_initiatives" as any)
        .select("*")
        .eq("is_published", true)
        .limit(10);
      if (error) throw error;
      return data as any[];
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ initiativeId, selected }: { initiativeId: string; selected: boolean }) => {
      if (selected) {
        const { error } = await supabase
          .from("member_preferences")
          .insert({ user_id: user!.id, initiative_id: initiativeId });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("member_preferences")
          .delete()
          .eq("user_id", user!.id)
          .eq("initiative_id", initiativeId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-preferences", user?.id] });
      toast.success("Preferences updated");
    },
  });

  const selectedIds = new Set(preferences?.map((p) => p.initiative_id));

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-teal-600" />
                <span className="text-xs font-bold uppercase tracking-widest text-teal-600">
                  Member Hub
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Welcome back, {profile?.full_name || "Member"}
              </h1>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl gap-2" onClick={() => navigate({ to: "/member/profile" })}>
                Account Settings
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Subscription Status Card */}
              <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
                <div className="bg-teal-600 px-8 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <CreditCard className="h-5 w-5" />
                    <span className="text-sm font-bold uppercase tracking-wider">Active Membership</span>
                  </div>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                    {subscription?.status || "No Active Plan"}
                  </Badge>
                </div>
                <p className="mt-4 font-display text-3xl font-bold text-primary">{c.value}</p>
                {"sub" in c && <p className="mt-1 text-xs text-muted-foreground capitalize font-medium">{c.sub}</p>}
              </div>
            ))}
          </div>

          <div className="mt-16">
            <h2 className="font-display text-2xl font-semibold text-primary">
              Your Impact Portfolio
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
                    className={`relative flex flex-col overflow-hidden rounded-3xl border p-6 transition ${
                      isSelected ? "border-teal-600 bg-teal-600/5 shadow-sm" : "border-border/40 bg-card"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                          {getJoinedField(i.organizations, "organization_name") || "Organization Partner"}
                        </span>
                        <h3 className="mt-1 font-display text-lg font-semibold text-primary">
                          {i.title}
                        </h3>
                      </div>
                      <p className="mt-2 text-muted-foreground text-sm">
                        Your next contribution will be processed on {subscription?.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : 'N/A'}.
                      </p>
                    </div>
                    <Button className="rounded-xl bg-primary hover:bg-primary/90 h-12 px-8 font-bold">
                      Change Amount
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Allocation Engine */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl font-bold text-primary flex items-center gap-2">
                    <Heart className="h-6 w-6 text-teal-600" />
                    Impact Distribution
                  </h2>
                  <Link to="/initiatives" className="text-sm font-bold text-teal-600 hover:underline flex items-center gap-1">
                    Explore more <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {allInitiatives?.map((i) => {
                    const isSelected = selectedIds.has(i.id);
                    return (
                      <div
                        key={i.id}
                        className={`relative flex flex-col overflow-hidden rounded-3xl border p-6 transition ${
                          isSelected ? "border-teal-600 bg-teal-600/5 shadow-sm" : "border-border/40 bg-card"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">
                              {(i as any).organization_name}
                            </span>
                            <h3 className="mt-1 font-display text-lg font-semibold text-primary">
                              {i.title}
                            </h3>
                          </div>
                          <button
                            onClick={() => toggleMutation.mutate({ initiativeId: i.id, selected: !isSelected })}
                            className={`grid h-8 w-8 place-items-center rounded-full transition ${
                              isSelected ? "bg-teal-600 text-white" : "bg-muted text-muted-foreground hover:bg-teal-100"
                            }`}
                          >
                            {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <AllocationPreview amount={subscription?.amount_mur || 0} userId={user?.id} />

              <Card className="rounded-3xl border-border/40 bg-muted/20">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Recent History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">No recent financial events.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
