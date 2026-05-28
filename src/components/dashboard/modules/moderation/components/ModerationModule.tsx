import { useModerationAnalytics } from "../hooks/use-moderation-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, AlertTriangle, Activity, TrendingUp, AlertCircle } from "lucide-react";

export function ModerationModule() {
  const { data, isLoading, isError, error } = useModerationAnalytics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  if (isError) {
    return (
      <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-6 text-center">
          <AlertCircle className="h-6 w-6 text-destructive mb-2" />
          <p className="text-xs font-bold text-destructive">Platform Metrics Error</p>
        </CardContent>
      </Card>
    );
  }

  const suspiciousPercentage = (Number(data?.suspiciousPatterns || 0)) * 10;

  return (
    <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/50 pb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-600">Platform Intelligence</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">System Health</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">Stable</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Growth Rate</span>
          </div>
          <span className="text-sm font-bold text-indigo-600">+{Number(data?.growthRate || 0)}%</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Anomalies</span>
          </div>
          <span className="text-sm font-bold">{Number(data?.anomaliesCount || 0)}</span>
        </div>

        <div className="pt-2">
          <div className="flex justify-between text-[10px] uppercase tracking-tighter text-muted-foreground font-bold mb-1">
            <span>Suspicious Activity Surfacing</span>
            <span>{Number(data?.suspiciousPatterns || 0)} detected</span>
          </div>
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-indigo-600" style={{ width: `${suspiciousPercentage}%` }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
