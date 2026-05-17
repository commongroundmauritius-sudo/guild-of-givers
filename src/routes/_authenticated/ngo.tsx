import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, Send, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/_authenticated/ngo")({
  component: NGODashboard,
});

function NGODashboard() {
  const { user, role, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showInitiativeForm, setShowInitiativeForm] = useState(false);
  const [newInitiative, setNewInitiative] = useState({
    title: "",
    description: "",
    goal: "",
    short_term_goals: "",
    long_term_goals: "",
    target_milestones: "",
    expected_outcomes: "",
    impact_pool_target: "0",
  });
  const [reportTitle, setReportTitle] = useState("");
  const [reportInitiativeId, setReportInitiativeId] = useState("");

  useEffect(() => {
    if (!authLoading && role && role !== "ngo") {
      toast.error("Unauthorized access");
      navigate({ to: "/dashboard" });
    }
  }, [role, authLoading, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user?.id).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: ngoProfile } = useQuery({
    queryKey: ["ngo-profile", profile?.ngo_id],
    queryFn: async () => {
      if (!profile?.ngo_id) return null;
      const { data } = await supabase.from("ngos").select("*").eq("id", profile.ngo_id).single();
      return data;
    },
    enabled: !!profile?.ngo_id,
  });

  const { data: initiatives, refetch: refetchInitiatives } = useQuery({
    queryKey: ["ngo-initiatives", ngoProfile?.id],
    queryFn: async () => {
      if (!ngoProfile?.id) return [];
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .eq("ngo_id", ngoProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!ngoProfile?.id,
  });

  const { data: reports } = useQuery({
    queryKey: ["ngo-reports", ngoProfile?.id],
    queryFn: async () => {
      if (!ngoProfile?.id) return [];
      const { data, error } = await supabase
        .from("reports")
        .select("*, initiatives(title)")
        .eq("ngo_id", ngoProfile.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!ngoProfile?.id,
  });

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      if (role !== "ngo" || !ngoProfile?.id || !reportInitiativeId)
        throw new Error("Unauthorized or Missing NGO/Initiative");
      const { error } = await supabase.from("reports").insert({
        ngo_id: ngoProfile.id,
        initiative_id: reportInitiativeId,
        title: reportTitle,
        file_url: "#", // Placeholder
        status: "pending_review",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted for admin review");
      setReportTitle("");
      queryClient.invalidateQueries({ queryKey: ["ngo-reports"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submitInitiativeMutation = useMutation({
    mutationFn: async () => {
      if (role !== "ngo" || !ngoProfile?.id) throw new Error("Unauthorized or Missing NGO context");
      const { error } = await supabase.from("initiatives").insert({
        ngo_id: ngoProfile.id,
        title: newInitiative.title,
        description: newInitiative.description,
        goal_amount_mur: Number(newInitiative.goal),
        short_term_goals: newInitiative.short_term_goals,
        long_term_goals: newInitiative.long_term_goals,
        target_milestones: newInitiative.target_milestones,
        expected_outcomes: newInitiative.expected_outcomes,
        impact_pool_target: Number(newInitiative.impact_pool_target),
        initiative_source: "ngo_submission",
        creator_user_id: user?.id,
        creator_role: "ngo",
        status: "active",
        is_approved: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Initiative submitted for approval");
      setNewInitiative({
        title: "",
        description: "",
        goal: "",
        short_term_goals: "",
        long_term_goals: "",
        target_milestones: "",
        expected_outcomes: "",
        impact_pool_target: "0",
      });
      setShowInitiativeForm(false);
      refetchInitiatives();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (authLoading) {
    return (
      <SiteLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-coral-500" />
        </div>
      </SiteLayout>
    );
  }

  const totalFunding = initiatives?.reduce(
    (acc, i) => acc + (Number(i.current_amount_mur) || 0),
    0,
  );

  return (
    <SiteLayout>
      <section className="min-h-screen bg-muted/30 py-20 font-inter">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-4xl font-semibold text-primary">
                  {ngoProfile?.name || "NGO Dashboard"}
                </h1>
                {ngoProfile?.is_verified && (
                  <div
                    className="flex items-center gap-1 rounded-full bg-forest-soft/10 px-3 py-1 text-xs font-medium text-forest-soft"
                    title="This organization has been verified by CommonGround Admins"
                  >
                    <BadgeCheck className="h-4 w-4" />
                    Verified
                  </div>
                )}
              </div>
              <p className="mt-2 text-muted-foreground">
                Manage your initiatives, funding cycles, and member updates.
              </p>
            </div>
            <button
              onClick={() => signOut().then(() => navigate({ to: "/login" }))}
              className="rounded-full border border-input bg-background px-5 py-2.5 text-sm hover:bg-muted"
            >
              Sign out
            </button>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Total Funding",
                value: `Rs ${(totalFunding || 0).toLocaleString()}`,
              },
              { title: "Active Initiatives", value: initiatives?.length ?? 0 },
              { title: "Impact Score", value: "—" },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-3xl border border-coral-500/20 bg-coral-500/5 p-6"
              >
                <p className="text-sm text-coral-500 font-medium">{c.title}</p>
                <p className="mt-3 font-display text-3xl text-coral-500">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold text-coral-500">
                  Your Initiatives
                </h2>
                <button
                  onClick={() => setShowInitiativeForm(!showInitiativeForm)}
                  className="rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white hover:bg-coral-600"
                >
                  {showInitiativeForm ? "Cancel" : "New Initiative"}
                </button>
              </div>

              {showInitiativeForm && (
                <div className="mt-6 rounded-3xl border border-coral-500/20 bg-coral-500/5 p-6 animate-in fade-in slide-in-from-top-4">
                  <h3 className="text-sm font-semibold text-coral-500 uppercase">
                    Submit New Initiative
                  </h3>
                  <div className="mt-4 space-y-4">
                    <input
                      placeholder="Initiative Title"
                      value={newInitiative.title}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, title: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                    />
                    <textarea
                      placeholder="Description"
                      value={newInitiative.description}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, description: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />
                    <input
                      placeholder="Funding Goal (MUR)"
                      type="number"
                      value={newInitiative.goal}
                      onChange={(e) => setNewInitiative({ ...newInitiative, goal: e.target.value })}
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                    />
                    <textarea
                      placeholder="Short-term Goals"
                      value={newInitiative.short_term_goals}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, short_term_goals: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />
                    <textarea
                      placeholder="Long-term Goals"
                      value={newInitiative.long_term_goals}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, long_term_goals: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />
                    <textarea
                      placeholder="Target Milestones"
                      value={newInitiative.target_milestones}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, target_milestones: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />
                    <textarea
                      placeholder="Expected Outcomes"
                      value={newInitiative.expected_outcomes}
                      onChange={(e) =>
                        setNewInitiative({ ...newInitiative, expected_outcomes: e.target.value })
                      }
                      className="w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-24"
                    />
                    <div>
                      <label className="text-xs font-medium text-coral-500 uppercase">
                        Impact Pool Target (MUR)
                      </label>
                      <input
                        placeholder="Impact Pool Target"
                        type="number"
                        value={newInitiative.impact_pool_target}
                        onChange={(e) =>
                          setNewInitiative({ ...newInitiative, impact_pool_target: e.target.value })
                        }
                        className="mt-1 w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                      />
                    </div>
                    <button
                      onClick={() => {
                        if (!newInitiative.title || !newInitiative.goal) {
                          toast.error("Title and goal are required");
                          return;
                        }
                        submitInitiativeMutation.mutate();
                      }}
                      disabled={
                        submitInitiativeMutation.isPending ||
                        !newInitiative.title ||
                        !newInitiative.goal
                      }
                      className="w-full rounded-xl bg-coral-500 py-3 text-sm font-medium text-white transition hover:bg-coral-600 disabled:opacity-50"
                    >
                      Submit for Approval
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {initiatives && initiatives.length > 0 ? (
                  initiatives.map((i) => (
                    <div
                      key={i.id}
                      className="group overflow-hidden rounded-3xl border border-border/40 bg-card transition hover:border-primary/40"
                    >
                      <div className="aspect-video bg-muted" />
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-display text-lg font-semibold text-primary">
                            {i.title}
                          </h3>
                          {!i.is_approved && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 uppercase">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {i.description}
                        </p>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs font-medium">
                            <span>Progress</span>
                            <span>
                              {(
                                ((Number(i.current_amount_mur) || 0) /
                                  Math.max(1, Number(i.goal_amount_mur) || 0)) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                          <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-coral-500"
                              style={{
                                width: `${((Number(i.current_amount_mur) || 0) / Math.max(1, Number(i.goal_amount_mur) || 0)) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                    <p className="text-muted-foreground">
                      You haven't created any initiatives yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="font-display text-2xl font-semibold text-coral-500">
                Submit Transparency Report
              </h2>
              <div className="mt-6 rounded-3xl border border-coral-500/20 bg-coral-500/5 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium uppercase text-coral-500/70">
                      Report Title
                    </label>
                    <input
                      value={reportTitle}
                      onChange={(e) => setReportTitle(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                      placeholder="Q1 2024 Impact Report"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium uppercase text-coral-500/70">
                      Related Initiative
                    </label>
                    <select
                      value={reportInitiativeId}
                      onChange={(e) => setReportInitiativeId(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                    >
                      <option value="">Select an initiative</option>
                      {initiatives?.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => submitReportMutation.mutate()}
                    disabled={submitReportMutation.isPending || !reportTitle || !reportInitiativeId}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-coral-500 py-3 text-sm font-medium text-white transition hover:bg-coral-600 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Submit for Approval
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
