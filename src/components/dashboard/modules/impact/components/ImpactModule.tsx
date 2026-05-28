import { useImpactMetrics } from "../hooks/use-impact-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Target } from "lucide-react";

export function ImpactModule() {
  const { data, isLoading } = useImpactMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Supporters</CardTitle>
          <Heart className="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.activeSupporters.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Validated monthly members</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Funded Initiatives</CardTitle>
          <Target className="h-4 w-4 text-rose-600" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.supportedInitiatives.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Unique programs receiving funds</p>
        </CardContent>
      </Card>
    </div>
  );
}
