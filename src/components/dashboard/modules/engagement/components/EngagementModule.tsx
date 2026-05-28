import { useEngagementMetrics } from "../hooks/use-engagement-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Share2, Users, Zap } from "lucide-react";

export function EngagementModule() {
  const { data, isLoading } = useEngagementMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Shares</CardTitle>
          <Share2 className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.shares.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Initiative viral reach</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Repeat Engagers</CardTitle>
          <Zap className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.repeatEngagers.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Members with more than 1 interaction</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active (7d)</CardTitle>
          <Users className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.activeSupporters7d.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Supporters active this week</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Multi-Choice</CardTitle>
          <Heart className="h-4 w-4 text-rose-500" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.multiInitiativeSupporters.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Supporting 2+ initiatives</p>
        </CardContent>
      </Card>
    </div>
  );
}
