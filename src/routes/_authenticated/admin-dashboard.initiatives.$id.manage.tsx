import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, ShieldCheck, EyeOff, Target, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CampaignLinkManager } from "@/components/dashboard/campaigns/CampaignLinkManager";
import { updateInitiative } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/_authenticated/admin-dashboard/initiatives/$id/manage")({
  component: AdminInitiativeManagePage,
});

function AdminInitiativeManagePage() {
  const { id } = Route.useParams();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<any>({
    title: "",
    description: "",
    summary: "",
    caption: "",
    status: "active",
    category: "Environment",
    goal_amount_mur: 0,
    impact_pool_target: 0,
    image_url: "",
    is_published: false,
  });

  const { data: initiative, isLoading, isError, error } = useQuery({
    queryKey: ["admin-initiative", id],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data, error } = await supabase.from("initiatives").select("*").eq("id", id).single();
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (initiative) {
      setFormData({
        title: initiative.title || "",
        description: initiative.description || "",
        summary: initiative.summary || "",
        caption: initiative.caption || "",
        status: initiative.status || "active",
        category: initiative.category || "Environment",
        goal_amount_mur: initiative.goal_amount_mur || 0,
        impact_pool_target: initiative.impact_pool_target || 0,
        image_url: initiative.image_url || "",
        is_published: initiative.is_published || false,
      });
    }
  }, [initiative]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      await updateInitiative({ data: { id, data } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-initiative", id] });
      toast.success("Initiative updated successfully");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (isError || !initiative) {
    return (
      <SiteLayout>
        <section className="bg-muted/30 min-h-screen py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-border/40 bg-card p-10 text-center shadow-sm">
              <h1 className="font-display text-2xl font-semibold text-primary">
                Unable to load initiative
              </h1>
              <p className="mt-3 text-muted-foreground">
                {error instanceof Error ? error.message : "The initiative could not be found or loaded."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button type="button" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-initiative", id] })}>
                  Retry
                </Button>
                <Button type="button" onClick={() => navigate({ to: "/admin-dashboard/initiatives" })}>
                  Back to Initiatives
                </Button>
              </div>
            </div>
          </div>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/admin-dashboard"
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition"
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
                  <TabsTrigger value="details" className="rounded-lg px-6">
                    General Details
                  </TabsTrigger>
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
                        <Select
                          value={formData.status}
                          onValueChange={(v) => handleCheckboxChange("status", v)}
                        >
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
                        <label className="text-sm font-medium text-muted-foreground">
                          Category
                        </label>
                        <Select
                          value={formData.category}
                          onValueChange={(v) => handleCheckboxChange("category", v)}
                        >
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
                        <label className="text-sm font-medium text-muted-foreground">
                          Initiative Title
                        </label>
                        <Input
                          name="title"
                          value={formData.title}
                          onChange={handleInputChange}
                          className="rounded-xl"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Short Caption
                        </label>
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
                    <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                      Content
                    </h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                          Full Description
                        </label>
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
                    <div className="text-xs text-muted-foreground">
                      Make this initiative live on discovery.
                    </div>
                  </div>
                  <Switch
                    aria-label="Public visibility"
                    checked={formData.is_published}
                    onCheckedChange={(v) => handleCheckboxChange("is_published", v)}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                  Impact Pool
                </h2>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Goal Amount (MUR)
                    </label>
                    <Input
                      name="goal_amount_mur"
                      type="number"
                      value={formData.goal_amount_mur}
                      onChange={handleInputChange}
                      className="rounded-xl font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Target Pool (MUR)
                    </label>
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
                    <label className="text-sm font-medium text-muted-foreground">
                      Hero Image URL
                    </label>
                    <Input
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleInputChange}
                      className="rounded-xl"
                      placeholder="https://..."
                    />
                    {formData.image_url && (
                      <div className="mt-2 aspect-video rounded-xl overflow-hidden border border-border/40">
                        <img
                          src={formData.image_url}
                          alt="Hero"
                          className="w-full h-full object-cover"
                        />
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
