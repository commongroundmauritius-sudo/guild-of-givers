import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ImagePlus, Link, Video } from "lucide-react";

interface HeroPanelProps {
  settings: any;
  onUpdate: (settings: any) => void;
}

export function HeroPanel({ settings, onUpdate }: HeroPanelProps) {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleChange = (field: string, value: any) => {
    const updated = { ...localSettings, [field]: value };
    setLocalSettings(updated);
    onUpdate(updated);
  };

  const handleCTAChange = (cta: "primaryCTA" | "secondaryCTA", field: string, value: string) => {
    const updated = {
      ...localSettings,
      [cta]: { ...(localSettings[cta] || {}), [field]: value }
    };
    setLocalSettings(updated);
    onUpdate(updated);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label>Headline</Label>
          <Input
            value={localSettings.headline || ""}
            onChange={(e) => handleChange("headline", e.target.value)}
            placeholder="Main hero title"
          />
        </div>

        <div className="space-y-2">
          <Label>Subheadline</Label>
          <Textarea
            value={localSettings.subheadline || ""}
            onChange={(e) => handleChange("subheadline", e.target.value)}
            placeholder="Detailed sub-text"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-border/40 bg-muted/20">
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Primary CTA</h4>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={localSettings.primaryCTA?.text || ""}
                onChange={(e) => handleCTAChange("primaryCTA", "text", e.target.value)}
                placeholder="Button text"
              />
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input
                value={localSettings.primaryCTA?.link || ""}
                onChange={(e) => handleCTAChange("primaryCTA", "link", e.target.value)}
                placeholder="/signup"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 bg-muted/20">
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Secondary CTA</h4>
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={localSettings.secondaryCTA?.text || ""}
                onChange={(e) => handleCTAChange("secondaryCTA", "text", e.target.value)}
                placeholder="Button text"
              />
            </div>
            <div className="space-y-2">
              <Label>Link</Label>
              <Input
                value={localSettings.secondaryCTA?.link || ""}
                onChange={(e) => handleCTAChange("secondaryCTA", "link", e.target.value)}
                placeholder="/initiatives"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid sm:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Label>Background Image</Label>
          <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-border/60 hover:bg-muted/50 cursor-pointer">
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
          </div>
          <Input
            value={localSettings.backgroundImage || ""}
            onChange={(e) => handleChange("backgroundImage", e.target.value)}
            placeholder="URL or use upload"
          />
        </div>

        <div className="space-y-4">
          <Label>Background Video (Optional)</Label>
          <div className="aspect-video bg-muted rounded-2xl flex items-center justify-center border-2 border-dashed border-border/60 hover:bg-muted/50 cursor-pointer">
            <Video className="h-8 w-8 text-muted-foreground" />
          </div>
          <Input
            value={localSettings.backgroundVideo || ""}
            onChange={(e) => handleChange("backgroundVideo", e.target.value)}
            placeholder="URL or use upload"
          />
        </div>
      </div>
    </div>
  );
}
