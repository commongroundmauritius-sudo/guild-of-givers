import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  ArrowLeft,
  Save,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  ShieldCheck,
  Target
} from "lucide-react";
import { CampaignLinkManager } from "@/components/dashboard/campaigns/CampaignLinkManager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/admin-dashboard/initiatives/$id/manage")({
  component: InitiativeEditPage,
});

function InitiativeEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, role, loading: authLoading } = useAuth();

  const { data: organizations } = useQuery({
    queryKey: ["all-organizations"],
    enabled: !!user && role === "admin",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("id, organization_name")
        .eq("status", "active")
        .order("organization_name");
      if (error) throw error;
      return data;
    },
  });

  const [formData, setFormData] = useState<any>({
    title: "",
    caption: "",
    summary: "",
    description: "",
    content: "",
    image_url: "",
    gallery_urls: [],
    goal_amount_mur: 0,
    impact_pool_target: 0,
    impact_pool_current: 0,
    status: "active",
    is_published: false,
    organization_id: "",
    category: "Environment"
  });

  const { data: initiative, isLoading: initiativeLoading } = useQuery({
    queryKey: ["initiative-edit", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (initiative) {
      setFormData({
        title: initiative.title || "",
        caption: initiative.caption || "",
        summary: initiative.summary || "",
        description: initiative.description || "",
        content: initiative.content || "",
        image_url: initiative.image_url || "",
        gallery_urls: initiative.gallery_urls || [],
        goal_amount_mur: initiative.goal_amount_mur || 0,
        impact_pool_target: initiative.impact_pool_target || 0,
        impact_pool_current: initiative.impact_pool_current || 0,
        status: initiative.status || "active",
        is_published: initiative.is_published || false,
        organization_id: initiative.organization_id || "",
        category: initiative.category || "Environment"
      });
    }
  }, [initiative]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase
        .from("initiatives")
        .update(updatedData)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Initiative updated successfully");
      queryClient.invalidateQueries({ queryKey: ["initiative-edit", id] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update initiative: " + error.message);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleCheckboxChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (authLoading || initiativeLoading) {
    return (
      <SiteLayout>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Link
              to="/admin-dashboard/initiatives"
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Initiatives
            </Link>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => navigate({ to: `/initiatives/${initiative?.slug}` } as any)}
              >
                Preview
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="rounded-xl gap-2 shadow-lg shadow-primary/20"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <Tabs defaultValue="details" className="w-full">
                <TabsList className="bg-card border border-border/40 p-1 rounded-xl mb-6">
                  <TabsTrigger value="details" className="rounded-lg px-6">General Details</TabsTrigger>
                  <TabsTrigger value="campaigns" className="rounded-lg px-6 gap-2">
                    <Target className="h-4 w-4" /> Campaigns
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="details" className="space-y-8 outline-none">
                  <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="font-display text-xl font-semibold text-primary">
                        Initiative Configuration
                      </h2>
                      <div className="flex gap-2">
                        {formData.is_published ? (
                          <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">
                            <ShieldCheck className="h-3 w-3 mr-1" /> Published
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" /> Draft
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 mb-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <Select value={formData.status} onValueChange={(v) => handleCheckboxChange("status", v)}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Category</label>
                        <Select value={formData.category} onValueChange={(v) => handleCheckboxChange("category", v)}>
                          <SelectTrigger className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Environment">Environment</SelectItem>
                            <SelectItem value="Education">Education</SelectItem>
                            <SelectItem value="Health">Health</SelectItem>
                            <SelectItem value="Community">Community</SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Initiative Title</label>
                        <Input
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Short Caption</label>
                        <Input
                          name="caption"
                          value={formData.caption}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Summary</label>
                        <Textarea
                          name="summary"
                          value={formData.summary}
                          onChange={handleInputChange}
                          className="rounded-xl min-h-[100px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                    <h2 className="mb-6 font-display text-xl font-semibold text-primary">Content</h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Full Description</label>
                        <Textarea
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          className="rounded-xl min-h-[150px]"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="campaigns" className="space-y-8 outline-none">
                  <CampaignLinkManager initiativeId={id} />
                </TabsContent>
              </Tabs>
            </div>

            <div className="space-y-8">
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Visibility</h2>
                <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-border/20">
                  <div className="space-y-0.5">
                    <div className="text-sm font-medium">Public Visibility</div>
                    <div className="text-xs text-muted-foreground">Make this initiative live on discovery.</div>
                  </div>
                  <Switch
                    checked={formData.is_published}
                    onCheckedChange={(v) => handleCheckboxChange("is_published", v)}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Impact Pool</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Goal Amount (MUR)</label>
                    <Input
                      name="goal_amount_mur"
                      type="number"
                      value={formData.goal_amount_mur}
                      onChange={handleInputChange}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Target Pool (MUR)</label>
                    <Input
                      name="impact_pool_target"
                      type="number"
                      value={formData.impact_pool_target}
                      onChange={handleInputChange}
                      className="rounded-xl font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Media</h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Hero Image URL</label>
                    <Input
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="rounded-xl"
                      placeholder="https://..."
                    />
                    {formData.image_url && (
                      <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-border/40">
                        <img src={formData.image_url} alt="Hero" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
