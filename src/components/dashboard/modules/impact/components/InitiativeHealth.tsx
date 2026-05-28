import { useInitiativeHealth, useInitiativeHealthHistory } from "@/hooks/intelligence/use-initiative-health";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function InitiativeHealth({ initiativeId }: { initiativeId: string }) {
  const { data: health, isLoading: healthLoading } = useInitiativeHealth(initiativeId);
  const { data: history, isLoading: historyLoading } = useInitiativeHealthHistory(initiativeId);

  if (healthLoading || historyLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  const getHealthColor = (score: number) => {
    if (score >= 80) return "bg-emerald-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Aggregate Health Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tracking-tighter">{health?.health_score || 0}</span>
              <span className="text-sm text-muted-foreground pb-2">/ 100</span>
            </div>
            <Progress value={health?.health_score || 0} className={`h-3 ${getHealthColor(health?.health_score || 0)}`} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Heuristic breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ScoreRow label="Supporter Growth" value={health?.growth_score} />
            <ScoreRow label="Conversion Efficiency" value={health?.conversion_score} />
            <ScoreRow label="Engagement Density" value={health?.engagement_score} />
            <ScoreRow label="Supporter Retention" value={health?.retention_score} />
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Health Trend (30d)</CardTitle>
        </CardHeader>
        <CardContent className="h-64 pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis
                dataKey="calculated_at"
                tickFormatter={(date) => new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="health_score"
                stroke="#6366f1"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

function ScoreRow({ label, value }: { label: string, value?: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-bold">{value || 0}%</span>
      </div>
      <Progress value={value || 0} className="h-1" />
    </div>
  );
}
