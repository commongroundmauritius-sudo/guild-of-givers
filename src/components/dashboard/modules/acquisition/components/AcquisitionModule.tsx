import { useAcquisitionMetrics } from "../hooks/use-acquisition-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, MousePointer2, AlertCircle } from "lucide-react";
import { SupporterJourney } from "./SupporterJourney";

export function AcquisitionModule() {
  const { data, isLoading, isError, error } = useAcquisitionMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  if (isError) {
    return (
      <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-destructive">Failed to load acquisition data</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {(error as any)?.message ||
              "You might not have permission to view this analytics data."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Total Visits
            </CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{Number(data?.visits || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique page views tracked</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Registrations
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.registrations || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total member accounts</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Top Channel
            </CardTitle>
            <MousePointer2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">
              {data?.topSources?.[0]?.name || "Direct"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {Number(data?.topSources?.[0]?.count || 0)} leads acquired
            </p>
          </CardContent>
        </Card>
      </div>

      <SupporterJourney />
    </div>
  );
}
