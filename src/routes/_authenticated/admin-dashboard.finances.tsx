import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  CreditCard,
  TrendingUp,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin-dashboard/finances")({
  component: AdminFinancesPage,
});

interface JoinedFinancialEvent extends Tables<"financial_events"> {
  profiles: { full_name: string | null } | null;
  initiatives: { title: string } | null;
  financial_accounts: { account_type: string } | null;
}

interface FundingCycleWithInitiative extends Tables<"initiative_funding_cycles"> {
  initiatives: { title: string } | null;
}

function AdminFinancesPage() {
  const { user, role } = useAuth();
  const [selectedInitiativeId, setSelectedInitiativeId] = useState<string | null>(null);

  const { data: metrics } = useQuery({
    queryKey: ["admin-financial-metrics"],
    enabled: !!user && role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_admin_financial_metrics" as any);
      if (error) throw error;
      return data as any;
    },
  });

  const { data: payments } = useQuery({
    queryKey: ["admin-recent-payments"],
    enabled: !!user && role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: activeSubs } = useQuery({
    queryKey: ["admin-active-subscriptions"],
    enabled: !!user && role === "admin",
    queryFn: async () => {
      const { count, error } = await supabase
        .from("subscriptions")
        .select("*", { count: "exact", head: true })
        .eq("status", "active");
      if (error) throw error;
      return count;
    },
  });

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600">
                  Financial Treasury
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Revenue & Allocations
              </h1>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl gap-2">
                <Download className="h-4 w-4" /> Export CSV
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
            <Card className="rounded-3xl border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                  Monthly Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs {metrics?.monthly_revenue?.toLocaleString() || "0"}
                </div>
                <div className="flex items-center mt-1 text-xs text-emerald-600 font-medium">
                  <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% vs last month
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                  Active Members
                </CardTitle>
                <CreditCard className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeSubs || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Recurring contributions</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                  Avg. Ticket
                </CardTitle>
                <DollarSign className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs {metrics?.avg_payment?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Per active member</p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border/40">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold text-muted-foreground uppercase">
                  Total Lifetime
                </CardTitle>
                <DollarSign className="h-4 w-4 text-amber-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  Rs {metrics?.lifetime_revenue?.toLocaleString() || "0"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Gross volume processed</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Payments Table */}
          <Card className="rounded-3xl border-border/40 overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-card px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-xl font-semibold">Transaction History</CardTitle>
                <div className="flex gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search payments..." className="pl-9 rounded-xl w-64" />
                  </div>
                  <Button variant="outline" size="icon" className="rounded-xl">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="pl-8">Member</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="pr-8 text-right">Reference</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments?.map((payment: any) => (
                    <TableRow key={payment.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-8">
                        <div className="flex flex-col">
                          <span className="font-bold text-primary">
                            {payment.profiles?.full_name || "Anonymous"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {payment.profiles?.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono font-medium">
                        Rs {payment.amount_mur.toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {payment.status === "success" ? (
                          <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 gap-1 rounded-lg">
                            <CheckCircle2 className="h-3 w-3" /> Success
                          </Badge>
                        ) : payment.status === "pending" ? (
                          <Badge variant="secondary" className="gap-1 rounded-lg">
                            <Clock className="h-3 w-3" /> Pending
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="gap-1 rounded-lg">
                            <AlertCircle className="h-3 w-3" /> Failed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="pr-8 text-right font-mono text-xs text-muted-foreground">
                        {payment.peach_payment_id || payment.id.substring(0, 8)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!payments || payments.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        No transactions found in this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
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
    },
  });

  if (isLoading)
    return (
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
              {new Date(e.created_at).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="capitalize text-[10px] font-bold">
                {e.event_type.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${e.financial_accounts?.account_type === "platform" ? "bg-amber-500" : "bg-teal-500"}`}
                />
                <span className="text-xs capitalize font-medium">
                  {e.financial_accounts?.account_type.replace("_", " ")}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="text-xs">
                <p className="font-semibold truncate max-w-[150px]">
                  {e.initiatives?.title || e.profiles?.full_name || "System"}
                </p>
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

function FinCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  sub: string;
  icon: any;
  color: "amber" | "teal";
}) {
  const colorCls = color === "amber" ? "text-amber-600 bg-amber-50" : "text-teal-600 bg-teal-50";
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
        <p className="text-[10px] text-muted-foreground leading-relaxed font-medium uppercase tracking-tight">
          {sub}
        </p>
      </div>
    </div>
  );
}
