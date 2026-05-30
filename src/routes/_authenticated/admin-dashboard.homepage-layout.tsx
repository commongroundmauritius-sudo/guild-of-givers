import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Home, Layout, Heart, Trash2, Search, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin-dashboard/homepage-layout")({
  component: HomepageLayoutPage,
});

type VisibilitySettings = {
  hero: boolean;
  valueProps: boolean;
  featured: boolean;
  forOrgs: boolean;
  faq: boolean;
};

interface FeaturedWithInitiative {
  id: string;
  initiative_id: string;
  display_order: number;
  initiatives: {
    title: string;
    status: string;
    image_url: string | null;
  } | null;
}

function HomepageLayoutPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [visibility, setVisibility] = useState<VisibilitySettings>({
    hero: true,
    valueProps: true,
    featured: true,
    forOrgs: true,
    faq: true,
  });

  // Fetch Visibility Settings
  const { data: settingsData } = useQuery({
    queryKey: ["homepage-settings"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_settings")
        .select("*")
        .eq("setting_key", "homepage_section_visibility")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch Featured Initiatives
  const { data: featuredData = [], isLoading: featuredLoading } = useQuery({
    queryKey: ["homepage-featured-initiatives"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_featured_initiatives")
        .select("*, initiatives(title, status, image_url)")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as FeaturedWithInitiative[];
    },
  });

  useEffect(() => {
    if (settingsData?.setting_value) {
      setVisibility(settingsData.setting_value as unknown as VisibilitySettings);
    }
  }, [settingsData]);

  // Mutation to save visibility
  const saveVisibilityMutation = useMutation({
    mutationFn: async (newVisibility: VisibilitySettings) => {
      const { error } = await supabase.from("homepage_settings").upsert({
        setting_key: "homepage_section_visibility",
        setting_value: newVisibility as unknown,
        updated_by: user?.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-settings"] });
      toast.success("Section visibility updated");
    },
    onError: (error: Error) => {
      toast.error("Failed to update visibility: " + error.message);
    },
  });

  const handleToggle = (key: keyof VisibilitySettings) => {
    const newVisibility = { ...visibility, [key]: !visibility[key] };
    setVisibility(newVisibility);
    saveVisibilityMutation.mutate(newVisibility);
  };

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Administration
              </span>
            </div>
            <h1 className="font-display text-4xl font-bold text-primary">Homepage Layout</h1>
            <p className="text-muted-foreground">
              Manage public homepage content and section visibility.
            </p>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layout className="h-5 w-5 text-primary" />
                    Section Visibility
                  </CardTitle>
                  <CardDescription>
                    Enable or disable main sections of the public homepage.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <VisibilityToggle
                    label="Hero Banner"
                    description="Main call to action and value proposition"
                    checked={visibility.hero}
                    onCheckedChange={() => handleToggle("hero")}
                    disabled={saveVisibilityMutation.isPending}
                  />
                  <VisibilityToggle
                    label="Community Statistics"
                    description="Impact metrics and value props"
                    checked={visibility.valueProps}
                    onCheckedChange={() => handleToggle("valueProps")}
                    disabled={saveVisibilityMutation.isPending}
                  />
                  <VisibilityToggle
                    label="Featured Initiatives"
                    description="Manual list of curated initiatives"
                    checked={visibility.featured}
                    onCheckedChange={() => handleToggle("featured")}
                    disabled={saveVisibilityMutation.isPending}
                  />
                  <VisibilityToggle
                    label="Partner Showcase"
                    description="Information for organizations"
                    checked={visibility.forOrgs}
                    onCheckedChange={() => handleToggle("forOrgs")}
                    disabled={saveVisibilityMutation.isPending}
                  />
                  <VisibilityToggle
                    label="FAQ Section"
                    description="Frequently asked questions"
                    checked={visibility.faq}
                    onCheckedChange={() => handleToggle("faq")}
                    disabled={saveVisibilityMutation.isPending}
                  />
                </CardContent>
              </Card>

              <div className="rounded-2xl bg-amber-50 p-4 border border-amber-200">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-amber-900">Visibility Note</p>
                    <p className="mt-1 text-xs text-amber-800 leading-relaxed">
                      Changes to visibility take effect immediately. If 'Featured Initiatives' is
                      enabled but no slots are filled, the section will still be hidden
                      automatically.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Card className="h-full rounded-[2rem]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-rose-500" />
                        Featured Initiatives
                      </CardTitle>
                      <CardDescription>
                        Select up to 4 initiatives to feature in the curated section.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {[1, 2, 3, 4].map((slot) => {
                      const featured = featuredData.find((f) => f.display_order === slot);
                      return (
                        <FeaturedSlot
                          key={slot}
                          slot={slot}
                          featured={featured}
                          isLoading={featuredLoading}
                        />
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

function VisibilityToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex flex-col space-y-1">
        <Label className="text-sm font-bold">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} />
    </div>
  );
}

function FeaturedSlot({
  slot,
  featured,
  isLoading,
}: {
  slot: number;
  featured?: FeaturedWithInitiative;
  isLoading: boolean;
}) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const removeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("homepage_featured_initiatives")
        .delete()
        .eq("display_order", slot);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-featured-initiatives"] });
      toast.success(`Slot ${slot} cleared`);
    },
  });

  return (
    <div
      className={cn(
        "relative rounded-[2rem] border-2 border-dashed p-6 transition-all h-[180px] flex flex-col justify-between",
        featured ? "border-primary/20 bg-primary/5" : "border-muted-foreground/20 bg-muted/20",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          Slot {slot}
        </span>
        {featured && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
            onClick={() => removeMutation.mutate()}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
          <div className="h-3 w-1/3 bg-muted animate-pulse rounded" />
        </div>
      ) : featured?.initiatives ? (
        <div className="space-y-2">
          <h3 className="font-bold text-primary leading-tight line-clamp-2">
            {featured.initiatives.title}
          </h3>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "text-[10px] font-bold uppercase px-2 py-0.5 rounded-full",
                featured.initiatives.status === "active"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700",
              )}
            >
              {featured.initiatives.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 space-y-3 text-center grow">
          <p className="text-xs text-muted-foreground">Empty Slot</p>
          <InitiativeSelector slot={slot} isOpen={isDialogOpen} setIsOpen={setIsDialogOpen} />
        </div>
      )}

      {!featured && !isLoading && (
        <div
          className="absolute inset-0 cursor-pointer rounded-[2rem]"
          onClick={() => setIsDialogOpen(true)}
        />
      )}
    </div>
  );
}

function InitiativeSelector({
  slot,
  isOpen,
  setIsOpen,
}: {
  slot: number;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: initiatives = [], isLoading } = useQuery({
    queryKey: ["initiatives-for-selection", search],
    enabled: isOpen,
    queryFn: async () => {
      let query = supabase
        .from("initiatives")
        .select("id, title, status")
        .neq("status", "archived")
        .order("title");

      if (search) {
        query = query.ilike("title", `%${search}%`);
      }

      const { data, error } = await query.limit(10);
      if (error) throw error;
      return data;
    },
  });

  const selectMutation = useMutation({
    mutationFn: async (initiativeId: string) => {
      const { data: existing } = await supabase
        .from("homepage_featured_initiatives")
        .select("display_order")
        .eq("initiative_id", initiativeId)
        .maybeSingle();

      if (existing) {
        throw new Error(`Already featured in Slot ${existing.display_order}`);
      }

      const { error } = await supabase.from("homepage_featured_initiatives").upsert(
        {
          display_order: slot,
          initiative_id: initiativeId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "display_order" },
      );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage-featured-initiatives"] });
      toast.success(`Slot ${slot} updated`);
      setIsOpen(false);
      setSearch("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
        <div className="space-y-4 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search programs..."
              className="pl-9 rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted animate-pulse rounded-xl" />
              ))
            ) : initiatives.length > 0 ? (
              initiatives.map((i) => (
                <button
                  key={i.id}
                  onClick={() => selectMutation.mutate(i.id)}
                  disabled={selectMutation.isPending}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-border/40 hover:bg-primary/5 hover:border-primary/20 transition-all text-left group"
                >
                  <div>
                    <p className="text-sm font-bold text-primary group-hover:text-primary">
                      {i.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase">{i.status}</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                </button>
              ))
            ) : (
              <p className="text-center py-8 text-sm text-muted-foreground italic">
                No initiatives found.
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
