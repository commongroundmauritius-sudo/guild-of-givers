import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Target,
  Users,
  TrendingUp,
  Plus,
  FileText,
  Send,
  Calendar,
  History,
  CheckCircle2,
  Eye,
  UserCheck,
  UserX
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/organization")({
  component: OrganizationDashboard,
});

export default function OrganizationDashboard() {
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [showNewInitiative, setShowNewInitiative] = useState(false);
  const [newInitiative, setNewInitiative] = useState({
    title: "",
    description: "",
    goal: "",
    monthly_target: "",
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*, organizations(*)")
        .eq("id", user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const organization = profile?.organizations;

  const { data: initiatives, isLoading } = useQuery({
    queryKey: ["org-initiatives", organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*")
        .eq("organization_id", organization?.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!organization?.id,
  });

  const { data: fundingCycles } = useQuery({
    queryKey: ["org-funding-cycles", organization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiative_funding_cycles")
        .select("*, initiatives(title)")
        .in("initiative_id", initiatives?.map(i => i.id) || [])
        .order("year", { ascending: false })
        .order("month", { ascending: false });
      return data;
    },
    enabled: !!initiatives?.length,
  });

  const submitInitiativeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("initiatives").insert({
        organization_id: organization?.id,
        title: newInitiative.title,
        description: newInitiative.description,
        goal_amount_mur: Number(newInitiative.goal),
        monthly_target_mur: Number(newInitiative.monthly_target),
        is_approved: false,
        is_published: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-initiatives"] });
      setShowNewInitiative(false);
      setNewInitiative({ title: "", description: "", goal: "", monthly_target: "" });
      toast.success("Initiative submitted for approval");
    },
    onError: (err: any) => toast.error(err.message),
  });

  if (authLoading || isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-16">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-3">
             {[1,2,3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
        </div>
      </SiteLayout>
    );
  }

  const totalRaised = initiatives?.reduce((acc, i) => acc + Number(i.current_amount_mur), 0) || 0;
  const totalViews = initiatives?.reduce((acc, i) => acc + (i.view_count || 0), 0) || 0;
  const totalAcquired = initiatives?.reduce((acc, i) => acc + (i.conversion_count || 0), 0) || 0;
  const totalActive = initiatives?.reduce((acc, i) => acc + (i.active_supporter_count || 0), 0) || 0;
  const totalInactive = initiatives?.reduce((acc, i) => acc + (i.inactive_supporter_count || 0), 0) || 0;
  const conversionRate = totalViews > 0 ? ((totalAcquired / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-coral-50 text-coral-600 border-coral-200">
                  <Building2 className="h-3 w-3 mr-1" />
                  Organization Partner
                </Badge>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-coral-600 sm:text-5xl">
                {organization?.organization_name || "Organization Dashboard"}
              </h1>
              <p className="mt-2 text-muted-foreground font-medium">
                Track your initiative funding cycles and impact metrics.
              </p>
            </div>
            <button
              onClick={() => setShowNewInitiative(!showNewInitiative)}
              className="flex items-center gap-2 rounded-full bg-coral-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-coral-600 shadow-lg shadow-coral-500/20"
            >
              <Plus className="h-4 w-4" />
              New Initiative
            </button>
          </div>

          {/* Stats Grid */}
          <div className="mt-12 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {[
              { title: "Lifetime Raised", value: `Rs ${totalRaised.toLocaleString()}`, icon: TrendingUp },
              { title: "Page Views", value: totalViews.toLocaleString(), icon: Eye },
              { title: "Members Acquired", value: totalAcquired.toLocaleString(), icon: UserCheck },
              { title: "Active Supporters", value: totalActive.toLocaleString(), icon: Users },
              { title: "Conversion Rate", value: `${conversionRate}%`, icon: TrendingUp },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-coral-500/20 bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-xl bg-coral-100 text-coral-600">
                    <c.icon className="h-4 w-4" />
                  </div>
                  <p className="text-[10px] text-coral-600 font-bold uppercase tracking-widest">{c.title}</p>
                </div>
                <p className="mt-4 font-display text-2xl font-bold text-primary">{c.value}</p>
              </div>
            ))}
          </div>

          {showNewInitiative && (
             <div className="mt-12 rounded-3xl border border-coral-500/20 bg-card p-8 shadow-xl max-w-2xl">
                <h2 className="text-2xl font-display font-semibold text-primary mb-6">Create New Initiative</h2>
                <div className="space-y-4">
                   <input
                     placeholder="Initiative Title"
                     value={newInitiative.title}
                     onChange={e => setNewInitiative({...newInitiative, title: e.target.value})}
                     className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                   />
                   <textarea
                     placeholder="Description"
                     value={newInitiative.description}
                     onChange={e => setNewInitiative({...newInitiative, description: e.target.value})}
                     className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-coral-500/20 h-32"
                   />
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Monthly Target (MUR)</label>
                        <input
                          placeholder="e.g. 50000"
                          type="number"
                          value={newInitiative.monthly_target}
                          onChange={e => setNewInitiative({...newInitiative, monthly_target: e.target.value})}
                          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground uppercase mb-1 block">Lifetime Goal (MUR)</label>
                        <input
                          placeholder="e.g. 500000"
                          type="number"
                          value={newInitiative.goal}
                          onChange={e => setNewInitiative({...newInitiative, goal: e.target.value})}
                          className="w-full rounded-xl border border-border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-coral-500/20"
                        />
                      </div>
                   </div>
                   <button
                     onClick={() => submitInitiativeMutation.mutate()}
                     className="w-full bg-coral-500 text-white font-bold py-4 rounded-xl hover:bg-coral-600 transition-colors shadow-lg shadow-coral-500/20"
                   >
                     Submit for Admin Review
                   </button>
                </div>
             </div>
          )}

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
             <div className="space-y-8">
                <h2 className="font-display text-2xl font-semibold text-primary flex items-center gap-2">
                   <Calendar className="h-6 w-6 text-coral-500" />
                   Funding Cycle History
                </h2>
                <div className="rounded-3xl border border-border/40 bg-card overflow-hidden">
                   <Table>
                      <TableHeader className="bg-muted/50">
                         <TableRow>
                            <TableHead>Initiative</TableHead>
                            <TableHead>Cycle</TableHead>
                            <TableHead className="text-right">Raised</TableHead>
                            <TableHead className="text-right">Supporters</TableHead>
                         </TableRow>
                      </TableHeader>
                      <TableBody>
                         {fundingCycles?.map(c => (
                            <TableRow key={c.id}>
                               <TableCell className="font-medium text-xs">{(c.initiatives as any)?.title}</TableCell>
                               <TableCell className="text-xs">{c.month}/{c.year}</TableCell>
                               <TableCell className="text-right font-display font-bold">Rs {Number(c.received_amount_mur).toLocaleString()}</TableCell>
                               <TableCell className="text-right">{c.supporter_count}</TableCell>
                            </TableRow>
                         ))}
                      </TableBody>
                   </Table>
                </div>
             </div>

             <div className="space-y-8">
                <h2 className="font-display text-2xl font-semibold text-primary flex items-center gap-2">
                   <CheckCircle2 className="h-6 w-6 text-coral-500" />
                   Initiative Performance
                </h2>
                <div className="space-y-4">
                   {initiatives?.map(i => {
                      const initiativeRate = (i.view_count || 0) > 0
                         ? ((i.conversion_count / i.view_count) * 100).toFixed(1)
                         : "0.0";

                      return (
                      <div key={i.id} className="p-6 rounded-3xl border border-border/40 bg-card hover:border-coral-500/40 transition-colors group">
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <h3 className="font-display font-bold text-lg">{i.title}</h3>
                               <div className="flex gap-2 mt-1">
                                  <Badge variant={i.is_approved ? "default" : "secondary"}>{i.is_approved ? 'Active' : 'Pending Review'}</Badge>
                                  <Badge variant="outline" className="text-[9px] uppercase tracking-tighter">
                                     {initiativeRate}% Conv.
                                  </Badge>
                               </div>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-bold text-muted-foreground uppercase">Target</p>
                               <p className="font-display font-bold">Rs {Number(i.monthly_target_mur).toLocaleString()} / mo</p>
                            </div>
                         </div>

                         <div className="grid grid-cols-4 gap-4 mb-6 py-4 border-y border-border/20">
                            <div className="text-center">
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">Views</p>
                               <p className="font-display font-bold text-sm">{i.view_count || 0}</p>
                            </div>
                            <div className="text-center">
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">Acquired</p>
                               <p className="font-display font-bold text-sm text-forest">{i.conversion_count || 0}</p>
                            </div>
                            <div className="text-center">
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">Active</p>
                               <p className="font-display font-bold text-sm text-blue-600">{i.active_supporter_count || 0}</p>
                            </div>
                            <div className="text-center">
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">Inactive</p>
                               <p className="font-display font-bold text-sm text-red-500">{i.inactive_supporter_count || 0}</p>
                            </div>
                         </div>

                         <div className="space-y-2">
                            <div className="flex justify-between text-xs font-bold">
                               <span className="text-muted-foreground uppercase">Funding Progress</span>
                               <span>Rs {Number(i.current_amount_mur).toLocaleString()} Total</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                               <div
                                 className="h-full bg-coral-500 rounded-full transition-all duration-1000"
                                 style={{ width: `${Math.min(100, (Number(i.current_amount_mur) / (Number(i.goal_amount_mur) || 1)) * 100)}%` }}
                               />
                            </div>
                         </div>
                      </div>
                   )})}
                </div>
             </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
