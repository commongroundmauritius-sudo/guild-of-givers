import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQPanelProps {
  settings: {
    title?: string;
    description?: string;
    items?: FAQItem[];
  };
  onUpdate: (settings: any) => void;
}

export const FAQPanel = ({ settings, onUpdate }: FAQPanelProps) => {
  const items = settings?.items || [];

  const handleAddItem = () => {
    onUpdate({
      ...settings,
      items: [...items, { q: "New Question", a: "New Answer" }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    onUpdate({ ...settings, items: newItems });
  };

  const handleUpdateItem = (index: number, field: "q" | "a", value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onUpdate({ ...settings, items: newItems });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        <div className="space-y-2">
          <Label htmlFor="faq-title">Section Title</Label>
          <Input
            id="faq-title"
            value={settings?.title || "Questions, answered."}
            onChange={(e) => onUpdate({ ...settings, title: e.target.value })}
            placeholder="e.target.value"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="faq-description">Section Description</Label>
          <Textarea
            id="faq-description"
            value={
              settings?.description ||
              "Everything you need to know about how CommonGround works, our vetting process, and what your membership unlocks."
            }
            onChange={(e) => onUpdate({ ...settings, description: e.target.value })}
            placeholder="Description..."
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-lg font-bold">FAQ Items</Label>
          <Button onClick={handleAddItem} size="sm" className="gap-2 rounded-full">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {items.map((item, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border border-border/40 rounded-[1.5rem] bg-white overflow-hidden shadow-sm"
            >
              <div className="flex items-center px-4">
                <AccordionTrigger className="hover:no-underline py-4 flex-1 font-bold text-primary">
                  {item.q || "New Question"}
                </AccordionTrigger>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 ml-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveItem(index);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <AccordionContent className="px-4 pb-4 space-y-4 border-t border-border/40 pt-4 bg-muted/10">
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    value={item.q}
                    onChange={(e) => handleUpdateItem(index, "q", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea
                    value={item.a}
                    onChange={(e) => handleUpdateItem(index, "a", e.target.value)}
                    rows={3}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border/60 rounded-[2rem] bg-muted/10 text-muted-foreground">
            <HelpCircle className="h-10 w-10 mb-2 opacity-20" />
            <p>No FAQ items yet. Click "Add Item" to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
};
