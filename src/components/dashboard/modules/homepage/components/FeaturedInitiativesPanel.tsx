import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeaturedInitiativesPanelProps {
  settings: any;
  onUpdate: (settings: any) => void;
}

export function FeaturedInitiativesPanel({ settings, onUpdate }: FeaturedInitiativesPanelProps) {
  const [search, setSearch] = useState("");
  const [manualIds, setManualIds] = useState<string[]>(settings.manual_ids || []);

  const { data: initiatives = [] } = useQuery({
    queryKey: ["initiatives-featured-selector", search],
    queryFn: async () => {
      let query = supabase
        .from("initiatives")
        .select("id, title, status")
        .neq("status", "archived")
        .limit(10);

      if (search) query = query.ilike("title", `%${search}%`);

      const { data } = await query;
      return data || [];
    },
  });

  const { data: selectedInitiatives = [] } = useQuery({
    queryKey: ["initiatives-featured-selected", manualIds],
    enabled: manualIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("id, title, status")
        .in("id", manualIds);

      // Sort by manualIds order
      return (data || []).sort((a, b) => manualIds.indexOf(a.id) - manualIds.indexOf(b.id));
    },
  });

  const addInitiative = (id: string) => {
    if (manualIds.includes(id)) return;
    const updated = [...manualIds, id];
    setManualIds(updated);
    onUpdate({ ...settings, manual_ids: updated });
  };

  const removeInitiative = (id: string) => {
    const updated = manualIds.filter((i) => i !== id);
    setManualIds(updated);
    onUpdate({ ...settings, manual_ids: updated });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-bold">Manual Selection</Label>
        <p className="text-sm text-muted-foreground">
          Select initiatives to feature prominently. Order determines display position.
        </p>

        <div className="space-y-3">
          {selectedInitiatives.map((i, index) => (
            <div key={i.id} className="flex items-center gap-4 p-3 bg-white border rounded-xl">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 font-medium">{i.title}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500"
                onClick={() => removeInitiative(i.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {selectedInitiatives.length === 0 && (
            <div className="p-8 text-center border-2 border-dashed rounded-2xl text-muted-foreground italic text-sm">
              No initiatives selected. Use the search below to add some.
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search programs to feature..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          {initiatives.map((i) => (
            <button
              key={i.id}
              onClick={() => addInitiative(i.id)}
              disabled={manualIds.includes(i.id)}
              className={cn(
                "w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all",
                manualIds.includes(i.id)
                  ? "bg-muted border-transparent opacity-50"
                  : "bg-white hover:border-primary/40 hover:bg-primary/5",
              )}
            >
              <div className="flex flex-col">
                <span className="font-bold text-primary">{i.title}</span>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                  {i.status}
                </span>
              </div>
              {!manualIds.includes(i.id) && <Plus className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <Label>Display Limit</Label>
          <Input
            type="number"
            className="w-20"
            value={settings.limit || 4}
            onChange={(e) => onUpdate({ ...settings, limit: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );
}
