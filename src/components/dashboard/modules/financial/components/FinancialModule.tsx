import { FinancialTraceTable } from "./FinancialTraceTable";
import { useFinancialMetrics } from "../hooks/use-financial-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, TrendingUp, DollarSign, AlertCircle } from "lucide-react";

export function FinancialModule() {
  const { data, isLoading, isError, error } = useFinancialMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  if (isError) {
    return (
      <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-destructive">Financial Overview Unavailable</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {(error as any)?.message || "Permission denied or network error."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              Rs {Number(data?.revenue || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Gross donations processed</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Active Members
            </CardTitle>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.activeSubscriptions || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Recurring monthly contributors</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Conv. Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">Lead to Subscriber efficiency</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Reliability
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.failedPayments || 0)}{" "}
              <span className="text-sm font-normal text-muted-foreground">failed</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(data?.totalRetries || 0)} retries attempted
            </p>
          </CardContent>
        </Card>
      </div>

      <FinancialTraceTable />
    </div>
  );
}
