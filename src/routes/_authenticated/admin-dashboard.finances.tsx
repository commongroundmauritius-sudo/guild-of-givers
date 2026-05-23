import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  Users,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  BarChart3,
  Waves,
  ShieldCheck
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin-dashboard/finances")({
  component: AdminFinancesPage,
});

function AdminFinancesPage() {
  const { user, role, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && (!user || role !== "admin")) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const { data: finances, isLoading } = useQuery({
    queryKey: ["admin-finances-authoritative"],
    queryFn: async () => {
      // 1. Authoritative metrics from RPC
      const { data: authoritative, error: rpcError } = await supabase.rpc('get_admin_financial_metrics');
      if (rpcError) throw rpcError;

      // 2. Supporter Metrics & Priority Distribution
      const [allSubs, memberPrefs, allAllocations] = await Promise.all([
        supabase.from("subscriptions").select("status, user_id"),
        supabase.from("member_preferences").select("priority_level"),
        supabase.from("allocations").select("amount_mur, potential_amount_mur, is_overflow, initiatives(is_impact_pool)")
      ]);

      const subs = allSubs.data || [];
      const totalSupporters = new Set(subs.map(s => s.user_id)).size;
      const activeSupporters = new Set(subs.filter(s => s.status === 'active').map(s => s.user_id)).size;
      const pausedSupporters = new Set(subs.filter(s => s.status === 'paused').map(s => s.user_id)).size;
      const cancelledSupporters = new Set(subs.filter(s => s.status === 'cancelled').map(s => s.user_id)).size;

      const priorityDist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
      (memberPrefs.data || []).forEach(p => {
        const lvl = p.priority_level;
        if (lvl >= 1 && lvl <= 4) {
          priorityDist[lvl] = (priorityDist[lvl] || 0) + 1;
        }
      });

      // 3. Allocation metrics (Historical)
      const allocs = allAllocations.data || [];
      const actualTotal = allocs.reduce((sum, a) => sum + Number(a.amount_mur), 0);
      const overflowTotal = allocs.filter(a => a.is_overflow).reduce((sum, a) => sum + Number(a.amount_mur), 0);
      const impactPoolTotal = allocs
        .filter(a => (a.initiatives as any)?.is_impact_pool)
        .reduce((sum, a) => sum + Number(a.amount_mur), 0);

      // 4. Current Future Potential (Based on Active Subs)
      const { data: activeSubDetails } = await supabase
        .from("subscriptions")
        .select("amount_mur, user_id")
        .eq("status", "active");

      const potentialDemand = (activeSubDetails || []).reduce((sum, s) => sum + Number(s.amount_mur), 0) * 0.80;

      return {
        authoritative,
        supporters: {
          total: totalSupporters,
          active: activeSupporters,
          paused: pausedSupporters,
          cancelled: cancelledSupporters,
          priorityDist
        },
        allocations: {
          actual: actualTotal,
          potential: potentialDemand,
          overflow: overflowTotal,
          impactPool: impactPoolTotal
        }
      };
    },
    enabled: role === "admin"
  });

  if (authLoading || isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-32 text-center text-muted-foreground font-display">
          <Skeleton className="h-12 w-64 mx-auto mb-8" />
          <div className="grid gap-6 md:grid-cols-4">
             {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
        </div>
      </SiteLayout>
    );
  }

  const { authoritative } = finances!;

  return (
    <SiteLayout>
      <div className="bg-muted/30 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="font-display text-4xl font-semibold text-primary">Financial Engine</h1>
              <p className="text-muted-foreground mt-2 text-sm uppercase tracking-wider font-bold">Internal Admin Dashboard</p>
            </div>
            <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-xs font-bold uppercase border border-amber-200">
              <ShieldCheck className="h-4 w-4" />
              Restricted Access
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4 mb-12">
            <FinCard
              title="Gross Contribution"
              value={`Rs ${authoritative.gross_total.toLocaleString()}`}
              sub="Successful payments (authoritative)"
              icon={TrendingUp}
              color="amber"
            />
            <FinCard
              title="NGO Pool (80%)"
              value={`Rs ${authoritative.ngo_pool_share.toLocaleString()}`}
              sub="Total assigned for distribution"
              icon={Waves}
              color="teal"
            />
            <FinCard
              title="CG Platform (20%)"
              value={`Rs ${authoritative.platform_share.toLocaleString()}`}
              sub="CommonGround infrastructure fee"
              icon={Target}
              color="amber"
            />
             <FinCard
              title="Monthly Forecast"
              value={`Rs ${authoritative.monthly_recurring_forecast.toLocaleString()}`}
              sub="Active recurring volume pipeline"
              icon={BarChart3}
              color="teal"
            />
          </div>

          <div className="grid gap-12 lg:grid-cols-2">
            <div>
               <h2 className="font-display text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  Supporter Ecosystem
               </h2>
               <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                  <div className="grid grid-cols-2 gap-8 mb-8 border-b border-border/40 pb-8">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Active Members</p>
                      <p className="text-3xl font-display font-bold text-teal-600">{finances?.supporters.active}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Unique</p>
                      <p className="text-3xl font-display font-bold text-primary">{finances?.supporters.total}</p>
                    </div>
                  </div>

                  <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4">Priority distribution (Active Selections)</p>
                  <div className="space-y-3">
                     {[1,2,3,4].map(p => {
                       const count = finances?.supporters.priorityDist[p] || 0;
                       const totalSelections = Object.values(finances?.supporters.priorityDist || {}).reduce((a,b) => a+b, 0);
                       const percentage = totalSelections ? (count / totalSelections) * 100 : 0;
                       return (
                         <div key={p}>
                            <div className="flex justify-between text-xs font-semibold mb-1">
                               <span>Priority #{p}</span>
                               <span className="text-muted-foreground">{count} selections</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                               <div
                                 className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                                 style={{ width: `${Math.min(100, percentage)}%` }}
                               />
                            </div>
                         </div>
                       )
                     })}
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-border/40">
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Paused</p>
                        <p className="text-lg font-bold text-amber-600">{finances?.supporters.paused}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Cancelled</p>
                        <p className="text-lg font-bold text-red-500">{finances?.supporters.cancelled}</p>
                      </div>
                  </div>
               </div>
            </div>

            <div>
               <h2 className="font-display text-2xl font-semibold text-primary mb-6 flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-teal-600" />
                  Allocation Integrity
               </h2>
               <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                  <div className="space-y-6">
                    <AllocRow
                      label="Actual Allocation (Paid)"
                      value={finances?.allocations.actual || 0}
                      desc="Funds successfully assigned to initiatives"
                    />
                    <AllocRow
                      label="Potential Demand (Active)"
                      value={finances?.allocations.potential || 0}
                      desc="Projected NGO pool from active memberships"
                      dim
                    />
                     <AllocRow
                      label="Overflow Redirected"
                      value={finances?.allocations.overflow || 0}
                      desc="Assigned via overflow fallback mechanisms"
                      warning
                    />
                     <AllocRow
                      label="Impact Pool Reserve"
                      value={finances?.allocations.impactPool || 0}
                      desc="Total funds currently held in platform reserve"
                      color="teal"
                    />
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function FinCard({ title, value, sub, icon: Icon, color }: any) {
  const colorCls = color === 'amber' ? 'text-amber-600 bg-amber-50' : 'text-teal-600 bg-teal-50';
  return (
    <div className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className={`p-2 rounded-xl ${colorCls}`}>
          <Icon className="h-5 w-5" />
        </div>
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{title}</p>
      </div>
      <p className="text-2xl font-display font-bold text-primary">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">{sub}</p>
    </div>
  );
}

function AllocRow({ label, value, desc, dim, warning, color }: any) {
  const valColor = warning ? 'text-amber-600' : color === 'teal' ? 'text-teal-600' : dim ? 'text-muted-foreground' : 'text-primary';
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-semibold text-sm text-primary">{label}</p>
        <p className="text-[10px] text-muted-foreground">{desc}</p>
      </div>
      <p className={`font-display font-bold ${valColor}`}>Rs {value.toLocaleString()}</p>
    </div>
  )
}
