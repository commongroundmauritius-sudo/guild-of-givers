import { getJoinedField, getJoinedData } from "@/lib/utils";
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
  Globe,
  EyeOff,
  Image as ImageIcon,
  Plus,
  X,
  AlertCircle,
  Loader2,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin-dashboard/initiatives/$id/manage")({
  component: InitiativeEditPage,
});

function InitiativeEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, user, loading: authLoading } = useAuth();
  const { data: organizations } = useQuery({
    queryKey: ["all-organizations"],
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

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (!authLoading && role && role !== "admin") {
      toast.error("Unauthorized access");
      navigate({ to: "/dashboard" });
    }
  }, [role, authLoading, navigate]);

  const {
    data: initiative,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["initiative", id],
    queryFn: async () => {
      if (!id) throw new Error("No initiative ID provided");

      const { data, error } = await supabase
        .from("initiatives")
        .select("*, organizations(organization_name)")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Initiative not found");
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
        goal_amount_mur: initiative.goal_amount_mur || 0,
        image_url: initiative.image_url || "",
        gallery_urls: initiative.gallery_urls || [],
        is_approved: initiative.is_approved || false,
        is_published: initiative.is_published || false,
        short_term_goals: initiative.short_term_goals || "",
        long_term_goals: initiative.long_term_goals || "",
        target_milestones: initiative.target_milestones || "",
        expected_outcomes: initiative.expected_outcomes || "",
        impact_pool_target: initiative.impact_pool_target || 0,
        impact_pool_current: initiative.impact_pool_current || 0,
        category: initiative.category || "",
        organization_id: initiative.organization_id || "",
      });
    }
  }, [initiative]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: Record<string, unknown>) => {
      const { error } = await supabase.from("initiatives").update(updatedData).eq("id", id);
      if (error) throw error;

      // Log the update
      if (user?.id) {
        await supabase.from("admin_actions").insert({
          admin_id: user.id,
          action_type: "update_initiative_content",
          target_id: id,
          target_type: "initiative",
          details: {
            is_published: updatedData.is_published,
            fields_updated: Object.keys(updatedData),
          },
        });
      }
    },
    onSuccess: () => {
      toast.success("Initiative updated successfully");
      queryClient.invalidateQueries({ queryKey: ["initiative", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["admin-actions"] });
    },
    onError: (error: Error) => {
      toast.error("Failed to update: " + (error as Error).message);
    },
  });

  if (authLoading || isLoading) {
    return (
      <SiteLayout>
        <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="animate-pulse text-muted-foreground">Loading initiative details...</p>
        </div>
      </SiteLayout>
    );
  }

  if (role !== "admin") {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center">
          <ShieldAlert className="mx-auto h-12 w-12 text-red-500" />
          <h1 className="mt-4 font-display text-2xl font-bold">Unauthorized</h1>
          <p className="mt-2 text-muted-foreground">
            You do not have administrative privileges to access this page.
          </p>
        </div>
      </SiteLayout>
    );
  }

  if (queryError || !initiative) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-red-100 p-4 text-red-600">
              <AlertCircle className="h-12 w-12" />
            </div>
          </div>
          <h1 className="font-display text-3xl font-bold text-primary">
            Failed to load initiative
          </h1>
          <p className="mt-4 text-muted-foreground">
            {queryError instanceof Error
              ? queryError.message
              : "The initiative could not be found or you do not have permission to view it."}
          </p>
          <div className="mt-10">
            <Link
              to="/admin-dashboard"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!formData) return null;

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleTogglePublished = () => {
    setFormData((prev: any) => ({ ...prev, is_published: !prev.is_published }));
  };

  const handleToggleApproved = () => {
    setFormData((prev: any) => ({ ...prev, is_approved: !prev.is_approved }));
  };

  const handleAddGalleryUrl = () => {
    setFormData((prev: any) => ({
      ...prev,
      gallery_urls: [...prev.gallery_urls, ""],
    }));
  };

  const handleGalleryUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.gallery_urls];
    newUrls[index] = value;
    setFormData((prev: any) => ({ ...prev, gallery_urls: newUrls }));
  };

  const handleRemoveGalleryUrl = (index: number) => {
    const newUrls = formData.gallery_urls.filter((_: unknown, i: number) => i !== index);
    setFormData((prev: any) => ({ ...prev, gallery_urls: newUrls }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <SiteLayout>
      <section className="min-h-screen bg-cream-soft/30 font-inter">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate({ to: "/admin-dashboard" })}
            className="mb-8 flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <div className="mb-12 flex flex-wrap items-center justify-between gap-6">
            <div>
              <span className="kicker">Admin / Manage Initiative</span>
              <h1 className="mt-3 font-display text-4xl font-semibold text-amber-500">
                {initiative.title}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Organization:{" "}
                <span className="font-medium text-primary">
                  {getJoinedField(initiative.organizations, "organization_name")}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggleApproved}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition ${
                  formData.is_approved
                    ? "border border-amber-500/20 bg-amber-500/10 text-amber-600"
                    : "border border-border bg-muted text-muted-foreground"
                }`}
              >
                {formData.is_approved ? (
                  <>
                    <ShieldCheck className="h-4 w-4" /> Approved
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" /> Pending
                  </>
                )}
              </button>
              <button
                onClick={handleTogglePublished}
                className={`flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-medium transition ${
                  formData.is_published
                    ? "border border-forest-soft/20 bg-forest-soft/10 text-forest-soft"
                    : "border border-border bg-muted text-muted-foreground"
                }`}
              >
                {formData.is_published ? (
                  <>
                    <Globe className="h-4 w-4" /> Published
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" /> Hidden
                  </>
                )}
              </button>
              <button
                onClick={handleSubmit}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 rounded-full bg-amber-500 px-8 py-2.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition hover:bg-amber-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-8 lg:col-span-2">
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                  Goals & Milestones
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Short-term Goals
                    </label>
                    <textarea
                      name="short_term_goals"
                      value={formData.short_term_goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Long-term Goals
                    </label>
                    <textarea
                      name="long_term_goals"
                      value={formData.long_term_goals}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Target Milestones
                    </label>
                    <textarea
                      name="target_milestones"
                      value={formData.target_milestones}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Expected Outcomes
                    </label>
                    <textarea
                      name="expected_outcomes"
                      value={formData.expected_outcomes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                  General Information
                </h2>
                <div className="mb-8 p-4 rounded-2xl bg-muted/50 border border-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Source:
                    </span>
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-bold uppercase text-amber-600">
                      {initiative?.initiative_source === "admin_created"
                        ? "Admin Created"
                        : "Organization Submission"}
                    </span>
                  </div>
                  {initiative?.creator_role && (
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Created By:
                      </span>
                      <span className="text-xs font-medium text-primary">
                        {initiative.creator_role.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid gap-6 sm:grid-cols-2 mb-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Category
                    </label>
                    <input
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="e.g. Environment, Education"
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Associated Organization
                    </label>
                    <select
                      name="organization_id"
                      value={formData.organization_id}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="">None / Internal</option>
                      {organizations?.map((organization: any) => (
                        <option key={organization.id} value={organization.id}>
                          {organization.organization_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Initiative Title
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Caption (Short tagline)
                    </label>
                    <input
                      name="caption"
                      value={formData.caption}
                      onChange={handleInputChange}
                      placeholder="e.g. Protecting Mauritius' coastal ecosystems"
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Summary / Bio
                    </label>
                    <textarea
                      name="summary"
                      value={formData.summary}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                  Campaign Details
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Description (Overview)
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={4}
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Full Story / Paragraph Content
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={10}
                      placeholder="Tell the full story of this initiative..."
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Media</h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Main Image URL
                    </label>
                    <div className="flex gap-2">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border/40 bg-muted">
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <input
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        placeholder="https://..."
                        className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Gallery Images
                    </label>
                    <div className="space-y-3">
                      {formData.gallery_urls.map((url: string, index: number) => (
                        <div key={index} className="flex gap-2">
                          <input
                            value={url}
                            onChange={(e) => handleGalleryUrlChange(index, e.target.value)}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveGalleryUrl(index)}
                            className="p-2 text-muted-foreground transition hover:text-red-500"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={handleAddGalleryUrl}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted/50"
                      >
                        <Plus className="h-3 w-3" /> Add Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                  Impact Pool
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Target Amount (MUR)
                    </label>
                    <input
                      name="impact_pool_target"
                      type="number"
                      value={formData.impact_pool_target}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Current Amount (MUR)
                    </label>
                    <input
                      name="impact_pool_current"
                      type="number"
                      value={formData.impact_pool_current}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Goal</h2>
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Goal Amount (MUR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                      Rs
                    </span>
                    <input
                      name="goal_amount_mur"
                      type="number"
                      value={formData.goal_amount_mur}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 py-3 pl-10 pr-4 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
