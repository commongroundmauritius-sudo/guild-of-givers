import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BadgeCheck, FileText, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/ngo")({
  component: NgoDashboard,
});

function NgoDashboard() {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [reportTitle, setReportTitle] = useState("");
  const [reportInitiativeId, setReportInitiativeId] = useState("");

  const { data: ngoProfile } = useQuery({
    queryKey: ["ngo-profile", user?.id],
    queryFn: async () => {
      // In a more complete system, we'd have a link table between users and ngos
      // For now, we'll fetch the first NGO as a mock for this user context
      const { data } = await supabase.from("ngos").select("*").limit(1).single();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: initiatives, refetch: refetchInitiatives } = useQuery({
    queryKey: ["ngo-initiatives", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, ngos(name)")
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user?.id,
  });

  const submitReportMutation = useMutation({
    mutationFn: async () => {
      if (!ngoProfile?.id || !reportInitiativeId) throw new Error("Missing NGO or Initiative");
      const { error } = await supabase.from("reports").insert({
        ngo_id: ngoProfile.id,
        initiative_id: reportInitiativeId,
        title: reportTitle,
        file_url: "#", // Placeholder
        status: "pending_review"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Report submitted for admin review");
      setReportTitle("");
      queryClient.invalidateQueries({ queryKey: ["ngo-reports"] });
    },
    onError: (err: any) => toast.error(err.message)
  });

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="kicker">Organization</span>
              <div className="flex items-center gap-3 mt-3">
                <h1 className="font-display text-4xl font-semibold text-coral-500 sm:text-5xl">
                  NGO Dashboard
                </h1>
                {ngoProfile?.is_verified && (
                  <div
                    className="mt-2 flex items-center gap-1.5 rounded-full bg-forest-soft/10 px-3 py-1 text-xs font-medium text-forest-soft"
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
              onClick={signOut}
              className="rounded-full border border-input bg-background px-5 py-2.5 text-sm hover:bg-muted"
            >
              Sign out
            </button>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { title: "Total Funding", value: "Rs 0" },
              { title: "Active Initiatives", value: initiatives?.length ?? 0 },
              { title: "Impact Score", value: "—" },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-coral-500/20 bg-coral-500/5 p-6">
                <p className="text-sm text-coral-500 font-medium">{c.title}</p>
                <p className="mt-3 font-display text-3xl text-coral-500">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl font-semibold text-coral-500">Your Initiatives</h2>
              <button className="rounded-full bg-coral-500 px-4 py-2 text-sm font-medium text-white hover:bg-coral-600">
                New Initiative
              </button>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {initiatives && initiatives.length > 0 ? (
                initiatives.map((i) => (
                  <div
                    key={i.id}
                    className="group overflow-hidden rounded-3xl border border-border/40 bg-card transition hover:border-primary/40"
                  >
                    <div className="aspect-video bg-muted" />
                    <div className="p-6">
                      <h3 className="font-display text-lg font-semibold text-primary">{i.title}</h3>
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {i.description}
                      </p>
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span>Progress</span>
                          <span>
                            {(
                              (Number(i.current_amount_mur) / Number(i.goal_amount_mur)) *
                              100
                            ).toFixed(0)}
                            %
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-coral-500"
                            style={{
                              width: `${(Number(i.current_amount_mur) / Number(i.goal_amount_mur)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                  <p className="text-muted-foreground">You haven't created any initiatives yet.</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="font-display text-2xl font-semibold text-coral-500">Submit Transparency Report</h2>
            <div className="mt-6 rounded-3xl border border-coral-500/20 bg-coral-500/5 p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium uppercase text-coral-500/70">Report Title</label>
                  <input
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                    placeholder="Q1 2024 Impact Report"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium uppercase text-coral-500/70">Related Initiative</label>
                  <select
                    value={reportInitiativeId}
                    onChange={e => setReportInitiativeId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-coral-500/20 bg-background px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                  >
                    <option value="">Select an initiative</option>
                    {initiatives?.map(i => (
                      <option key={i.id} value={i.id}>{i.title}</option>
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
