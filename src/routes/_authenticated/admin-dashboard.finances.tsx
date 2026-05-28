import { SiteLayout } from "@/components/site/SiteLayout";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Tables } from "@/integrations/supabase/client";
import {
  TrendingUp,
  ArrowRightLeft,
  ShieldCheck,
  History,
  Target,
  Info,
  Search,
  Loader2,
  AlertCircle,
  FileText
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin-dashboard/finances")({
  component: FinancesDashboardPage,
});

interface JoinedFinancialEvent extends Tables<"financial_events"> {
  profiles: { full_name: string | null } | null;
  initiatives: { title: string } | null;
  financial_accounts: { account_type: string } | null;
}

interface FundingCycleWithInitiative extends Tables<"initiative_funding_cycles"> {
  initiatives: { title: string } | null;
}

function FinancesDashboardPage() {
  const { user, role } = useAuth();
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["admin-financial-metrics"],
    enabled: !!user && role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_financial_metrics");
      if (error) throw error;
      return data as {
        total_revenue: number;
        platform_revenue: number;
        distributed_funds: number;
        pending_payouts: number;
        reconciliation_drift: number;
      };
    }
  });

  const { data: initiatives } = useQuery({
    queryKey: ["admin-initiatives-list"],
    enabled: !!user && role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("id, title, current_amount_mur, goal_amount_mur")
        .order("title");
      if (error) throw error;
      return data;
    }
  });

  const { data: initiativeHistory } = useQuery({
    queryKey: ["admin-initiative-history", selectedInitiativeId],
    enabled: !!user && role === "admin" && !!selectedInitiativeId,
    queryFn: async () => {
      const [cyclesRes, eventsRes] = await Promise.all([
        supabase
          .from("initiative_funding_cycles")
          .select("*")
          .eq("initiative_id", selectedInitiativeId!)
          .order("year", { ascending: false })
          .order("month", { ascending: false }),
        supabase
          .from("financial_events")
          .select("*, profiles(full_name)")
          .eq("initiative_id", selectedInitiativeId!)
          .order("created_at", { ascending: false })
          .limit(10)
      ]);

      return {
        cycles: cyclesRes.data as Tables<"initiative_funding_cycles">[],
        recentEvents: eventsRes.data as unknown as (Tables<"financial_events"> & { profiles: { full_name: string | null } | null })[]
      };
    }
  });

  if (metricsLoading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="mt-4 text-muted-foreground font-display">Securing financial systems...</p>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="min-h-screen bg-cream-soft/30 p-8 font-inter">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl font-bold text-primary">Financial Oversight</h1>
              <p className="mt-2 text-muted-foreground text-sm uppercase tracking-widest font-bold">
                Transparency Ledger & Revenue Control
              </p>
            </div>
            {metrics && metrics.reconciliation_drift !== 0 && (
              <div className="flex items-center gap-3 rounded-2xl bg-red-50 px-5 py-3 border border-red-100 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span className="text-sm font-bold">Drift Detected: Rs {metrics.reconciliation_drift.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <FinCard
              title="Total Volume"
              value={`Rs ${Number(metrics?.total_revenue || 0).toLocaleString()}`}
              sub="Total funds processed"
              icon={TrendingUp}
              color="amber"
            />
            <FinCard
              title="Platform Fee"
              value={`Rs ${Number(metrics?.platform_revenue || 0).toLocaleString()}`}
              sub="CommonGround Sustainability"
              icon={ShieldCheck}
              color="teal"
            />
            <FinCard
              title="Distributed"
              value={`Rs ${Number(metrics?.distributed_funds || 0).toLocaleString()}`}
              sub="Allocated to initiatives"
              icon={ArrowRightLeft}
              color="teal"
            />
            <FinCard
              title="Impact Ratio"
              value="80.0%"
              sub="Direct to ground impact"
              icon={Target}
              color="amber"
            />
          </div>

          <Tabs defaultValue="initiatives" className="space-y-6">
            <TabsList className="bg-white/50 border border-border/40 rounded-full p-1 h-auto">
              <TabsTrigger value="initiatives" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                Initiative Performance
              </TabsTrigger>
              <TabsTrigger value="ledger" className="rounded-full px-8 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white">
                Master Ledger
              </TabsTrigger>
            </TabsList>

            <TabsContent value="initiatives" className="space-y-6">
              <div className="grid gap-8 lg:grid-cols-[350px_1fr]">
                {/* Initiative List */}
                <Card className="rounded-3xl border-border/40 overflow-hidden h-fit">
                  <CardHeader className="bg-card">
                    <CardTitle className="font-display text-lg">Vetted Initiatives</CardTitle>
                    <CardDescription>Select to view detailed metrics</CardDescription>
                  </CardHeader>
                  <CardContent className="p-2">
                    <div className="space-y-1">
                      {initiatives?.map((initiative) => (
                        <button
                          key={initiative.id}
                          onClick={() => setSelectedInitiativeId(initiative.id)}
                          className={`w-full text-left p-4 rounded-2xl transition-all ${
                            selectedInitiativeId === initiative.id
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "hover:bg-muted"
                          }`}
                        >
                          <p className="font-bold text-sm truncate">{initiative.title}</p>
                          <p className={`text-[10px] mt-1 ${selectedInitiativeId === initiative.id ? "text-white/70" : "text-muted-foreground"}`}>
                            Target: Rs {Number(initiative.goal_amount_mur).toLocaleString()}
                          </p>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Initiative Details */}
                <div className="space-y-6">
                  {selectedInitiativeId ? (
                    <>
                      <Card className="rounded-3xl border-border/40">
                        <CardHeader>
                          <CardTitle className="font-display flex items-center gap-2">
                            <FileText className="h-5 w-5 text-teal-600" />
                            Funding Cycle History
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Period</TableHead>
                                <TableHead className="text-right">Target</TableHead>
                                <TableHead className="text-right">Received</TableHead>
                                <TableHead className="text-right">Overflow</TableHead>
                                <TableHead>Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {initiativeHistory?.cycles.map((c) => (
                                <TableRow key={c.id}>
                                  <TableCell className="font-bold">
                                    {new Date(c.year, c.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-xs">
                                    Rs {Number(c.target_amount_mur).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-xs text-teal-600 font-bold">
                                    Rs {Number(c.received_amount_mur).toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-xs text-amber-600">
                                    Rs {Number(c.overflow_amount_mur).toLocaleString()}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant={c.status === "completed" ? "default" : "secondary"} className="text-[10px] uppercase">
                                      {c.status}
                                    </Badge>
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
                            {initiativeHistory?.recentEvents.map((e) => (
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
  const { user, role } = useAuth();

  const { data: events, isLoading } = useQuery({
    queryKey: ["admin-master-ledger"],
    enabled: !!user && role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("financial_events")
        .select("*, profiles(full_name), initiatives(title), financial_accounts(account_type)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as JoinedFinancialEvent[];
    }
  });

  if (isLoading) return (
    <div className="p-12 text-center">
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );

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
        {events?.map((e) => (
          <TableRow key={e.id} className="hover:bg-muted/30 transition-colors">
            <TableCell className="text-xs text-muted-foreground">
              {new Date(e.created_at).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
              })}
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

function FinCard({ title, value, sub, icon: Icon, color }: { title: string, value: string, sub: string, icon: any, color: 'amber' | 'teal' }) {
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
