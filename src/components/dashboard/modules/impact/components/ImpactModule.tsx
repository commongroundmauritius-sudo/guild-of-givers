import { useImpactMetrics } from "../hooks/use-impact-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Target, Shield, Activity } from "lucide-react";
import { InitiativeHealth } from "./InitiativeHealth";

export function ImpactModule({ initiativeId }: { initiativeId?: string }) {
  const { data, isLoading } = useImpactMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Lives Impacted</CardTitle>
            <Heart className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.totalImpact.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated direct impact</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Initiatives</CardTitle>
            <Target className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently running campaigns</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Verified Orgs</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.verifiedOrgs}</div>
            <p className="text-xs text-muted-foreground mt-1">Trust-vetted organizations</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Engagement</CardTitle>
            <Activity className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.engagementScore}%</div>
            <p className="text-xs text-muted-foreground mt-1">Supporter activity rate</p>
          </CardContent>
        </Card>
      </div>

      {initiativeId && <InitiativeHealth initiativeId={initiativeId} />}
    </div>
  );
}
