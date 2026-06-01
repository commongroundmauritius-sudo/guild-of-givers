import { useQuery } from "@tanstack/react-query";
import { impactMetricsService } from "@/lib/impact-metrics-service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImpactMetricsPanelProps {
  settings: any;
  onUpdate: (settings: any) => void;
}

export function ImpactMetricsPanel({ settings, onUpdate }: ImpactMetricsPanelProps) {
  const { data: autoMetrics, refetch, isFetching } = useQuery({
    queryKey: ["impact-metrics-auto"],
    queryFn: () => impactMetricsService.calculateMetrics(),
  });

  const updateMetric = (id: string, updates: any) => {
    const updatedMetrics = settings.metrics.map((m: any) =>
      m.id === id ? { ...m, ...updates } : m
    );
    onUpdate({ ...settings, metrics: updatedMetrics });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-primary">Impact Statistics</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="rounded-full gap-2"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
          Refresh Auto Values
        </Button>
      </div>

      <div className="grid gap-6">
        {settings.metrics.map((metric: any) => (
          <div key={metric.id} className="p-4 bg-white border rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-primary">{metric.label}</span>
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">{metric.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs">Visible</Label>
                <Switch
                  checked={metric.visible !== false}
                  onCheckedChange={(visible) => updateMetric(metric.id, { visible })}
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Switch
                  checked={metric.auto}
                  onCheckedChange={(auto) => updateMetric(metric.id, { auto })}
                />
                <Label>Auto Calculation</Label>
              </div>

              {!metric.auto && (
                <div className="space-y-1">
                  <Label className="text-xs">Manual Value</Label>
                  <Input
                    type="number"
                    value={metric.manualValue || 0}
                    onChange={(e) => updateMetric(metric.id, { manualValue: parseInt(e.target.value) })}
                  />
                </div>
              )}

              {metric.auto && autoMetrics && (
                <div className="text-sm font-medium text-forest bg-forest/5 p-2 rounded-lg">
                  Current System Value: {getAutoValue(metric.id, autoMetrics)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getAutoValue(id: string, metrics: any) {
  switch (id) {
    case "donations": return metrics.totalDonations;
    case "ngos": return metrics.totalOrganizations;
    case "volunteers": return metrics.totalVolunteers;
    case "campaigns": return metrics.totalInitiatives;
    default: return 0;
  }
}
