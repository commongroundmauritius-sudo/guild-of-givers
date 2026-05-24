import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  PieChart,
  TrendingUp,
  ShieldCheck,
  Waves,
  Target,
  Users,
  Search,
  ArrowRightLeft,
  Calendar,
  History,
  Info
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin-dashboard/finances")({
  component: AdminFinances,
});

export default function AdminFinances() {
  const { user, role, loading: authLoading } = useAuth();
  const [selectedInitiative, setSelectedInitiative] = useState<string | null>(null);

  const { data: finances, isLoading } = useQuery({
    queryKey: ["admin-financial-metrics"],
    queryFn: async () => {
      const { data: accounts } = await supabase
        .from("financial_accounts")
        .select("*")
        .in("account_type", ["platform", "organization_pool", "impact_pool", "fee"]);

      const balances = (accounts || []).reduce((acc: any, curr) => {
        acc[curr.account_type] = Number(curr.cached_balance_mur);
        return acc;
      }, { platform: 0, organization_pool: 0, impact_pool: 0, fee: 0 });

      const { data: ledgerMetrics } = await supabase.rpc("get_ledger_summary_metrics");

      const { data: currentCycle } = await supabase
        .from("billing_cycles")
        .select("*")
        .order("year", { ascending: false })
        .order("month", { ascending: false })
        .limit(1)
        .single();

      return {
        balances,
        metrics: ledgerMetrics || {
          gross_contributions: 0,
          net_contributions: 0,
          total_fees: 0,
          platform_share: 0,
          organization_pool: 0,
          impact_pool: 0,
          recurring_forecast: 0
        },
        currentCycle
      };
    },
    enabled: role === "admin"
  });

  const { data: initiatives } = useQuery({
    queryKey: ["admin-initiatives-finances"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select(`
          id,
          title,
          monthly_target_mur,
          current_amount_mur,
          organizations(organization_name)
        `)
        .order("current_amount_mur", { ascending: false });
      return data;
    },
    enabled: role === "admin"
  });

  const { data: initiativeHistory } = useQuery({
    queryKey: ["initiative-finance-drilldown", selectedInitiative],
    queryFn: async () => {
      if (!selectedInitiative) return null;

      const [cycles, events] = await Promise.all([
        supabase
          .from("initiative_funding_cycles")
          .select("*")
          .eq("initiative_id", selectedInitiative)
          .order("year", { ascending: false })
          .order("month", { ascending: false }),
        supabase
          .from("financial_events")
          .select("*, profiles(full_name)")
          .eq("initiative_id", selectedInitiative)
          .order("created_at", { ascending: false })
          .limit(20)
      ]);

      return {
        cycles: cycles.data || [],
        recentEvents: events.data || []
      };
    },
    enabled: !!selectedInitiative && role === "admin"
  });

  if (authLoading || isLoading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-32">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-4">
             {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="bg-muted/30 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h1 className="font-display text-4xl font-semibold text-primary">Financial Intelligence</h1>
              <p className="text-muted-foreground mt-2 text-sm uppercase tracking-wider font-bold">Immutable Ledger & Money Flow</p>
            </div>
            <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full text-xs font-bold uppercase border border-amber-200">
              <ShieldCheck className="h-4 w-4" />
              Ledger Source of Truth
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-4 mb-12">
            <FinCard
              title="Gross Contribution"
              value={`Rs ${finances?.metrics.gross_contributions.toLocaleString()}`}
              sub="Total volume processed"
              icon={TrendingUp}
              color="amber"
            />
            <FinCard
              title="Transaction Fees"
              value={`Rs ${finances?.metrics.total_fees.toLocaleString()}`}
              sub={`Balance: Rs ${finances?.balances.fee.toLocaleString()}`}
              icon={ArrowRightLeft}
              color="teal"
            />
            <FinCard
              title="CG Platform (20%)"
              value={`Rs ${finances?.metrics.platform_share.toLocaleString()}`}
              sub={`Balance: Rs ${finances?.balances.platform.toLocaleString()}`}
              icon={Target}
              color="amber"
            />
             <FinCard
              title="Impact Pool"
              value={`Rs ${finances?.metrics.impact_pool.toLocaleString()}`}
              sub={`Balance: Rs ${finances?.balances.impact_pool.toLocaleString()}`}
              icon={Waves}
              color="teal"
            />
          </div>

          <Tabs defaultValue="overview" className="space-y-12">
            <TabsList className="bg-card border border-border/40 p-1 rounded-2xl">
              <TabsTrigger value="overview" className="rounded-xl px-6">System Overview</TabsTrigger>
              <TabsTrigger value="initiatives" className="rounded-xl px-6">Initiative Drill-down</TabsTrigger>
              <TabsTrigger value="ledger" className="rounded-xl px-6">Master Ledger</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
               <div className="grid gap-8 lg:grid-cols-3">
                  <Card className="lg:col-span-2 rounded-3xl border-border/40 overflow-hidden">
                    <CardHeader className="bg-card">
                      <CardTitle className="font-display flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-amber-600" />
                        Money Flow Distribution
                      </CardTitle>
                      <CardDescription>Aggregate lifetime metrics from immutable financial events</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                       <div className="space-y-8">
                          <DistributionRow
                            label="Organization Pool (80%)"
                            value={finances?.metrics.organization_pool || 0}
                            total={finances?.metrics.net_contributions || 1}
                            color="bg-teal-500"
                          />
                          <DistributionRow
                            label="CommonGround Share (20%)"
                            value={finances?.metrics.platform_share || 0}
                            total={finances?.metrics.net_contributions || 1}
                            color="bg-amber-500"
                          />
                       </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-3xl border-border/40">
                    <CardHeader>
                      <CardTitle className="font-display">Current Cycle</CardTitle>
                      <CardDescription>
                        {finances?.currentCycle ? `${new Intl.DateTimeFormat('en-US', { month: 'long' }).format(new Date(0, finances.currentCycle.month - 1))} ${finances.currentCycle.year}` : 'Loading...'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-6">
                          <div>
                            <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Recurring Forecast</p>
                            <p className="text-3xl font-display font-bold text-primary">Rs {finances?.metrics.recurring_forecast.toLocaleString()}</p>
                          </div>
                          <div className="pt-6 border-t border-border/40">
                             <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Cycle ends in {finances?.currentCycle ? Math.ceil((new Date(finances.currentCycle.end_date).getTime() - new Date().getTime()) / (1000 * 3600 * 24)) : '...'} days
                             </div>
                          </div>
                       </div>
                    </CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="initiatives">
               <div className="grid gap-8 lg:grid-cols-3">
                  <Card className="lg:col-span-1 rounded-3xl border-border/40">
                    <CardHeader>
                      <CardTitle className="font-display">Select Initiative</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                       <div className="divide-y divide-border/40">
                          {initiatives?.map(i => (
                            <button
                              key={i.id}
                              onClick={() => setSelectedInitiative(i.id)}
                              className={`w-full text-left p-4 hover:bg-muted transition-colors ${selectedInitiative === i.id ? 'bg-muted border-l-4 border-amber-500' : ''}`}
                            >
                               <p className="font-semibold text-sm truncate">{i.title}</p>
                               <p className="text-xs text-muted-foreground">{(i.organizations as any)?.organization_name}</p>
                               <p className="text-xs font-bold mt-1 text-primary">Rs {Number(i.current_amount_mur).toLocaleString()}</p>
                            </button>
                          ))}
                       </div>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2 space-y-8">
                     {selectedInitiative ? (
                       <>
                        <Card className="rounded-3xl border-border/40">
                          <CardHeader>
                            <CardTitle className="font-display">Funding Cycle History</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Cycle</TableHead>
                                  <TableHead className="text-right">Target</TableHead>
                                  <TableHead className="text-right">Received</TableHead>
                                  <TableHead className="text-right">Overflow</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {initiativeHistory?.cycles.map((c: any) => (
                                  <TableRow key={c.id}>
                                    <TableCell className="font-medium">{c.month}/{c.year}</TableCell>
                                    <TableCell className="text-right">Rs {Number(c.target_amount_mur).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">Rs {Number(c.received_amount_mur).toLocaleString()}</TableCell>
                                    <TableCell className="text-right">Rs {Number(c.overflow_amount_mur).toLocaleString()}</TableCell>
                                    <TableCell>
                                      <Badge variant={c.status === 'completed' ? 'default' : 'secondary'}>{c.status}</Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>

                        <Card className="rounded-3xl border-border/40">
                          <CardHeader>
                            <CardTitle className="font-display flex items-center gap-2">
                              <History className="h-5 w-5 text-teal-600" />
                              Recent Ledger Activity
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                             <div className="space-y-4">
                                {initiativeHistory?.recentEvents.map((e: any) => (
                                  <div key={e.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/20">
                                     <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${e.event_type === 'allocation' ? 'bg-teal-100 text-teal-700' : 'bg-amber-100 text-amber-700'}`}>
                                           <ArrowRightLeft className="h-4 w-4" />
                                        </div>
                                        <div>
                                           <p className="text-sm font-semibold capitalize">{e.event_type.replace('_', ' ')}</p>
                                           <p className="text-[10px] text-muted-foreground">
                                              {new Date(e.created_at).toLocaleString()} • {e.profiles?.full_name || 'System'}
                                           </p>
                                        </div>
                                     </div>
                                     <p className="font-display font-bold text-primary">Rs {Number(e.amount_mur).toLocaleString()}</p>
                                  </div>
                                ))}
                             </div>
                          </CardContent>
                        </Card>
                       </>
                     ) : (
                       <div className="h-full flex flex-col items-center justify-center text-muted-foreground bg-card border border-border/40 rounded-3xl p-12 text-center">
                          <Search className="h-12 w-12 mb-4 opacity-20" />
                          <p className="font-display text-xl font-semibold">No initiative selected</p>
                          <p className="text-sm">Select an initiative from the list to view its financial history and cycle metrics.</p>
                       </div>
                     )}
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="ledger">
               <Card className="rounded-3xl border-border/40 overflow-hidden">
                  <CardHeader className="bg-card">
                    <CardTitle className="font-display">Immutable Master Ledger</CardTitle>
                    <CardDescription>Every single movement of money across the CommonGround network</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                     <MasterLedgerTable />
                  </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </SiteLayout>
  );
}

function MasterLedgerTable() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-master-ledger"],
    queryFn: async () => {
      const { data } = await supabase
        .from("financial_events")
        .select("*, profiles(full_name), initiatives(title), financial_accounts(account_type)")
        .order("created_at", { ascending: false })
        .limit(50);
      return data;
    }
  });

  if (isLoading) return <div className="p-12 text-center"><Skeleton className="h-64 w-full rounded-2xl" /></div>;

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead className="w-[180px]">Timestamp</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Account</TableHead>
          <TableHead>Entity/User</TableHead>
          <TableHead className="text-right">Previous</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Resulting</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {events?.map((e: any) => (
          <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
            <TableCell className="text-xs text-muted-foreground">
              {new Date(e.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
            </TableCell>
            <TableCell>
               <Badge variant="outline" className="capitalize text-[10px] font-bold">
                 {e.event_type.replace('_', ' ')}
               </Badge>
            </TableCell>
            <TableCell>
               <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${e.financial_accounts?.account_type === 'platform' ? 'bg-amber-500' : 'bg-teal-500'}`} />
                  <span className="text-xs capitalize font-medium">{e.financial_accounts?.account_type.replace('_', ' ')}</span>
               </div>
            </TableCell>
            <TableCell>
               <div className="text-xs">
                 <p className="font-semibold truncate max-w-[150px]">{e.initiatives?.title || e.profiles?.full_name || 'System'}</p>
               </div>
            </TableCell>
            <TableCell className="text-right text-xs text-muted-foreground font-mono">
               Rs {Number(e.previous_balance).toLocaleString()}
            </TableCell>
            <TableCell className="text-right font-display font-bold text-primary whitespace-nowrap">
               Rs {Number(e.amount_mur).toLocaleString()}
            </TableCell>
            <TableCell className="text-right font-display font-bold text-teal-600 whitespace-nowrap">
               Rs {Number(e.resulting_balance).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
      <div className="flex items-center gap-1.5 mt-1">
        <Info className="h-3 w-3 text-muted-foreground/60" />
        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium uppercase tracking-tight">{sub}</p>
      </div>
    </div>
  );
}

function DistributionRow({ label, value, total, color }: any) {
  const percentage = (value / total) * 100;
  return (
    <div className="space-y-2">
       <div className="flex justify-between items-end">
          <div>
             <p className="text-sm font-semibold text-primary">{label}</p>
             <p className="text-[10px] text-muted-foreground font-bold uppercase">Rs {value.toLocaleString()}</p>
          </div>
          <p className="text-sm font-display font-bold text-primary">{percentage.toFixed(1)}%</p>
       </div>
       <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${color} rounded-full transition-all duration-1000`}
            style={{ width: `${percentage}%` }}
          />
       </div>
    </div>
  );
}
