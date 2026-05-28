import { useAcquisitionMetrics } from "../hooks/use-acquisition-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, MousePointer2 } from "lucide-react";

export function AcquisitionModule() {
  const { data, isLoading } = useAcquisitionMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Visits</CardTitle>
          <Globe className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.visits.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Unique page views tracked</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Registrations</CardTitle>
          <Users className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{data?.registrations.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">Total member accounts</p>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Top Source</CardTitle>
          <MousePointer2 className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold capitalize">{data?.topSources[0]?.name || "Direct"}</div>
          <p className="text-xs text-muted-foreground mt-1">{data?.topSources[0]?.count || 0} leads captured</p>
        </CardContent>
      </Card>
    </div>
  );
}
