import { GripVertical, Eye, EyeOff, Settings2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface SectionItemProps {
  id: string;
  label: string;
  visible: boolean;
  onToggle: (visible: boolean) => void;
  onConfigure: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SectionItem({
  id,
  label,
  visible,
  onToggle,
  onConfigure,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: SectionItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 bg-white border border-border/60 rounded-2xl shadow-sm transition-all",
        !visible && "opacity-60 grayscale-[0.5]",
      )}
    >
      <div className="flex flex-col gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1">
        <h3 className="font-bold text-primary">{label}</h3>
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-black">
          {id.replace(/_/g, " ")}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={onConfigure}
          className="rounded-xl gap-2 hover:bg-primary/5"
        >
          <Settings2 className="h-4 w-4" />
          <span className="hidden sm:inline">Configure</span>
        </Button>

        <div className="h-6 w-px bg-border/60" />

        <div className="flex items-center gap-2">
          {visible ? (
            <Eye className="h-4 w-4 text-forest" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          )}
          <Switch
            checked={visible}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-forest"
          />
        </div>
      </div>
    </div>
  );
}
