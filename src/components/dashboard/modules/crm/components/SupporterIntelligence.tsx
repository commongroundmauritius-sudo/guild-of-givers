import { useRetentionStats } from "@/hooks/intelligence/use-retention";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

export function SupporterIntelligence({ organizationId }: { organizationId: string }) {
  const { data, isLoading } = useRetentionStats(organizationId);

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  const chartData = [
    { name: 'Active', value: data?.summary.active || 0, color: '#10b981' },
    { name: 'Dormant', value: data?.summary.dormant || 0, color: '#f59e0b' },
    { name: 'Inactive', value: data?.summary.inactive || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="rounded-3xl border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Retention Summary</CardTitle>
        </CardHeader>
        <CardContent className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
              No data available
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/40">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Quick Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm text-muted-foreground">Total Supporters</span>
            <span className="text-xl font-bold">{data?.summary.totalSupporters}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm text-muted-foreground">Lifetime Revenue</span>
            <span className="text-xl font-bold">MUR {data?.summary.totalLifetimeRevenue.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center border-b pb-2">
            <span className="text-sm text-muted-foreground">Retention Rate</span>
            <span className="text-xl font-bold">
              {data?.summary.totalSupporters ? Math.round((data.summary.active / data.summary.totalSupporters) * 100) : 0}%
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
