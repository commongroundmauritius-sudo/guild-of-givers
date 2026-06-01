import { useState } from "react";
import { Monitor, Tablet, Smartphone, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HomepagePreviewProps {
  config: any;
  isOpen: boolean;
  onClose: () => void;
}

export function HomepagePreview({ config, isOpen, onClose }: HomepagePreviewProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black text-white">
        <div className="flex items-center gap-4">
          <h2 className="font-bold text-lg">Homepage Preview</h2>
          <div className="flex bg-white/10 rounded-lg p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDevice("desktop")}
              className={cn("rounded-md gap-2 h-8", device === "desktop" && "bg-white/20")}
            >
              <Monitor className="h-4 w-4" /> Desktop
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDevice("tablet")}
              className={cn("rounded-md gap-2 h-8", device === "tablet" && "bg-white/20")}
            >
              <Tablet className="h-4 w-4" /> Tablet
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDevice("mobile")}
              className={cn("rounded-md gap-2 h-8", device === "mobile" && "bg-white/20")}
            >
              <Smartphone className="h-4 w-4" /> Mobile
            </Button>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/10">
          <X className="h-6 w-6" />
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex justify-center p-8">
        <div className={cn(
          "bg-white rounded-t-xl overflow-hidden shadow-2xl transition-all duration-300",
          device === "desktop" && "w-full max-w-7xl",
          device === "tablet" && "w-[768px]",
          device === "mobile" && "w-[375px]"
        )}>
          <div className="w-full h-full overflow-y-auto bg-slate-50">
            <div className="sticky top-0 z-10 bg-amber-100 border-b border-amber-200 px-6 py-2 flex items-center gap-2 text-xs font-bold text-amber-800">
              <AlertCircle className="h-3 w-3" />
              DRAFT PREVIEW MODE - Not Published
            </div>

            <div className="space-y-0">
              {config.sections.filter((s: any) => s.visible).map((section: any) => (
                <div key={section.id} className="relative group">
                  <div className="absolute top-4 left-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="bg-primary text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
                      Section: {section.id}
                    </span>
                  </div>
                  <div className="bg-white border-b">
                    {/* Simplified mock rendering for preview */}
                    {renderPreviewSection(section)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function renderPreviewSection(section: any) {
  const { id, settings } = section;
  switch (id) {
    case "hero":
      return (
        <div className="py-20 px-8 bg-cream-deep/20 text-center">
          <h1 className="text-4xl font-extrabold text-primary mb-4">{settings.headline || "Headline"}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">{settings.subheadline}</p>
          <div className="flex justify-center gap-4">
            <div className="px-6 py-3 bg-primary text-white rounded-full font-bold">{settings.primaryCTA?.text}</div>
            <div className="px-6 py-3 border border-primary text-primary rounded-full font-bold">{settings.secondaryCTA?.text}</div>
          </div>
        </div>
      );
    case "stats":
      return (
        <div className="py-12 px-8 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {(settings.metrics || []).filter((m: any) => m.visible !== false).map((m: any) => (
            <div key={m.id} className="text-center">
              <div className="text-2xl font-bold text-primary">###</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground">{m.label}</div>
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="py-12 px-8 text-center text-muted-foreground italic border-dashed border-2 m-4 rounded-3xl">
          Preview for {id} section
        </div>
      );
  }
}
