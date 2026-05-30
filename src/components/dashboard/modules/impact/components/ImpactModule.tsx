import { useImpactMetrics } from "../hooks/use-impact-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Target, Shield, Activity, AlertCircle } from "lucide-react";
import { InitiativeHealth } from "./InitiativeHealth";

export function ImpactModule({ initiativeId }: { initiativeId?: string }) {
  const { data, isLoading, isError, error } = useImpactMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  if (isError) {
    return (
      <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-destructive">Impact Metrics Unavailable</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {(error as any)?.message || "Failed to load impact data."}
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
              Lives Impacted
            </CardTitle>
            <Heart className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.totalImpact || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Estimated direct impact</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Active Initiatives
            </CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.activeCount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Currently running campaigns</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Verified Orgs
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.verifiedOrgs || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Trust-vetted organizations</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Engagement
            </CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Number(data?.engagementScore || 0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Supporter activity rate</p>
          </CardContent>
        </Card>
      </div>

      {initiativeId && <InitiativeHealth initiativeId={initiativeId} />}
    </div>
  );
}
