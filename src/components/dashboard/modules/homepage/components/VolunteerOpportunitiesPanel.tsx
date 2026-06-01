import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface VolunteerOpportunitiesPanelProps {
  settings: any;
  onUpdate: (settings: any) => void;
}

export function VolunteerOpportunitiesPanel({
  settings,
  onUpdate,
}: VolunteerOpportunitiesPanelProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="font-bold text-primary">Volunteer Opportunities</h3>
        <p className="text-sm text-muted-foreground">
          This section automatically pulls initiatives where "Volunteer Opportunity" is enabled.
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
            <Label>Auto-select matching initiatives</Label>
            <p className="text-xs text-muted-foreground">
              Pulls all initiatives marked as volunteer opportunities.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
