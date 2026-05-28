import { useModerationAlerts } from "../hooks/use-moderation-alerts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, ShieldCheck, AlertTriangle, Eye, Users, CreditCard, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function ModerationModule() {
  const { data, isLoading } = useModerationAlerts();

  if (isLoading) return <div className="h-48 animate-pulse bg-muted rounded-3xl" />;

  const hasCritical = data?.alerts.some(a => a.type === 'critical');
  const hasWarning = data?.alerts.some(a => a.type === 'warning');

  return (
    <Card className="rounded-3xl border-border/40 overflow-hidden shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3 bg-muted/20 border-b border-border/20 px-6">
        <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
          {hasCritical ? <ShieldAlert className="h-4 w-4 text-destructive" /> : <ShieldCheck className="h-4 w-4 text-primary" />}
          System Integrity
        </CardTitle>
        {data?.alerts.length ? (
          <Badge variant={hasCritical ? "destructive" : "outline"} className={cn("px-2 py-0 h-5 text-[10px]", !hasCritical && "text-amber-600 border-amber-200 bg-amber-50")}>
            {data.alerts.length} Alerts
          </Badge>
        ) : (
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 px-2 py-0 h-5 text-[10px]">Normal</Badge>
        )}
      </CardHeader>
      <CardContent className="p-6">
        {data?.alerts.length ? (
          <ul className="space-y-3 mb-6">
            {data.alerts.map((alert, idx) => (
              <li key={idx} className="flex items-start gap-3 text-sm leading-tight animate-in fade-in slide-in-from-left-2 duration-300">
                <div className={cn(
                  "p-1 rounded-lg mt-0.5",
                  alert.type === 'critical' ? 'bg-destructive/10' :
                  alert.type === 'warning' ? 'bg-amber-100' : 'bg-blue-50'
                )}>
                  <AlertTriangle className={cn(
                    "h-3.5 w-3.5",
                    alert.type === 'critical' ? 'text-destructive' :
                    alert.type === 'warning' ? 'text-amber-600' : 'text-blue-500'
                  )} />
                </div>
                <span className="font-medium">{alert.message}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground mb-6">No suspicious activity patterns detected in current logs.</p>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/20">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold">{data?.metrics.recentSignups}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Signups</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold">{(data?.metrics.failureRate || 0 * 100).toFixed(0)}%</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Fail Rate</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
              <Eye className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold">{data?.metrics.recentViews.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Live Views</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-sm font-bold">{data?.metrics.recentConversions}</div>
              <div className="text-[10px] text-muted-foreground uppercase font-semibold">Conv.</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
