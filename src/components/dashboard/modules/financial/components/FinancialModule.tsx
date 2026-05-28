import { useFinancialMetrics } from "../hooks/use-financial-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, TrendingUp, DollarSign, AlertCircle } from "lucide-react";

export function FinancialModule() {
  const { data, isLoading } = useFinancialMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">Rs {data?.revenue.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Gross donations processed</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Members</CardTitle>
          <CreditCard className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.activeSubscriptions.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Recurring monthly contributors</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Conv. Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground mt-1">Lead to Subscriber efficiency</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40 bg-amber-50/50">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Reliability</CardTitle>
          <AlertCircle className="h-4 w-4 text-amber-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.failedPayments} <span className="text-sm font-normal text-muted-foreground">failed</span></div>
          <p className="text-xs text-muted-foreground mt-1">{data?.totalRetries} retries attempted</p>
        </CardContent>
      </Card>
    </div>
  );
}
