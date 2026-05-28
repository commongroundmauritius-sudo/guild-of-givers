import { useEngagementMetrics } from "../hooks/use-engagement-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Share2, Repeat, Zap } from "lucide-react";

export function EngagementModule() {
  const { data, isLoading } = useEngagementMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Share Clicks</CardTitle>
          <Share2 className="h-4 w-4 text-forest" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.shares.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Initiative links shared</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Repeat Visitors</CardTitle>
          <Repeat className="h-4 w-4 text-forest" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.repeatVisitors.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Users returning to platform</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Engagement Score</CardTitle>
          <Zap className="h-4 w-4 text-forest" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.engagementEvents.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Total interactions logged</p>
        </CardContent>
      </Card>
    </div>
  );
}
