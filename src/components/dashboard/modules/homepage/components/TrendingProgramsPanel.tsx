import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface TrendingProgramsPanelProps {
  settings: any;
  onUpdate: (settings: any) => void;
}

export function TrendingProgramsPanel({ settings, onUpdate }: TrendingProgramsPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-bold text-primary">Trending Programs</h3>
        <p className="text-sm text-muted-foreground">
          This section uses engagement metrics (views, conversions) to show trending initiatives.
        </p>
      </div>

      <div className="grid gap-6">
        <div className="flex items-center justify-between p-4 bg-white border rounded-2xl">
          <Label>Display Limit</Label>
          <Input
            type="number"
            className="w-24"
            value={settings.limit || 4}
            onChange={(e) => onUpdate({ ...settings, limit: parseInt(e.target.value) })}
          />
        </div>

        <div className="flex items-center gap-2 p-4 bg-muted/20 rounded-2xl border border-dashed">
          <Switch
            checked={settings.auto !== false}
            onCheckedChange={(auto) => onUpdate({ ...settings, auto })}
          />
          <div>
            <Label>Auto-select trending initiatives</Label>
            <p className="text-xs text-muted-foreground">Uses platform momentum algorithm.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
