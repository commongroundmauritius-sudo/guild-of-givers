import { useEngagementMetrics } from "../hooks/use-engagement-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Share2, Users, Zap, AlertCircle } from "lucide-react";

export function EngagementModule() {
  const { data, isLoading, isError, error } = useEngagementMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  if (isError) {
    return (
      <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-destructive">Engagement Data Unavailable</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {(error as any)?.message || "We encountered an error loading the engagement metrics."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Shares
          </CardTitle>
          <Share2 className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{Number(data?.shares || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Initiative viral reach</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Repeat Engagers
          </CardTitle>
          <Zap className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {Number(data?.repeatEngagers || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Members with more than 1 interaction</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Active (7d)
          </CardTitle>
          <Users className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {Number(data?.activeSupporters7d || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Supporters active this week</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Multi-Choice
          </CardTitle>
          <Heart className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">
            {Number(data?.multiInitiativeSupporters || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Supporting 2+ initiatives</p>
        </CardContent>
      </Card>
    </div>
  );
}
