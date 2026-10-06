import { Button } from "@/components/ui/button";
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
  Loader2,
  Building,
  Target,
  Sparkles,
  Link as LinkIcon,
} from "lucide-react";
import { createInitiative } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/_authenticated/admin-dashboard/initiatives/new")({
  component: InitiativeCreatePage,
});

function InitiativeCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role, user, loading: authLoading } = useAuth();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    caption: "",
    summary: "",
    description: "",
    content: "",
    image_url: "",
    gallery_urls: [] as string[],
    goal_amount_mur: 100000,
    impact_pool_target: 0,
    impact_pool_current: 0,
    short_term_goals: "",
    long_term_goals: "",
    target_milestones: "",
    expected_outcomes: "",
    category: "Environment",
    organization_id: "",
    is_published: false,
  });

  useEffect(() => {
    if (!authLoading && role && role !== "admin" && role !== "super_admin") {
      toast.error("Unauthorized access");
      navigate({ to: "/dashboard" });
    }
  }, [role, authLoading, navigate]);

  const { data: organizations, isError: organizationsError, error: organizationsQueryError } = useQuery({
    queryKey: ["all-organizations"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
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

  const createMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      return await createInitiative({ data: { data: formData, publish } });
    },
    onSuccess: (data) => {
      toast.success("Initiative created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-initiatives"] });
      navigate({ to: "/admin-dashboard/initiatives/$id/manage", params: { id: data.id } });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create initiative");
    },
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? Number(value) : value,
    }));
  };

  const handleAddGalleryUrl = () => {
    setFormData((prev) => ({
      ...prev,
      gallery_urls: [...prev.gallery_urls, ""],
    }));
  };

  const handleGalleryUrlChange = (index: number, value: string) => {
    const newUrls = [...formData.gallery_urls];
    newUrls[index] = value;
    setFormData((prev) => ({
      ...prev,
      gallery_urls: newUrls,
    }));
  };

  const handleRemoveGalleryUrl = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      gallery_urls: prev.gallery_urls.filter((_, i) => i !== index),
    }));
  };

  if (authLoading) {
    return (
      <SiteLayout>
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-16 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <Link
              to="/admin-dashboard/initiatives"
              className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition"
            >
              <ArrowLeft className="h-4 w-4" /> Back to Initiatives
            </Link>
            <div className="flex gap-4">
              <button
                onClick={() => createMutation.mutate(false)}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-6 py-2.5 text-sm font-bold shadow-sm hover:bg-muted"
              >
                <EyeOff className="h-4 w-4" /> Save as Draft
              </button>
              <button
                onClick={() => createMutation.mutate(true)}
                disabled={createMutation.isPending}
                className="flex items-center gap-2 rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-amber-500/20 hover:bg-amber-600 transition-all active:scale-95"
              >
                <Globe className="h-4 w-4" /> Publish Now
              </button>
            </div>
          </div>

          {organizationsError && (
            <div className="mb-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
              <p className="font-semibold text-destructive">Unable to load partner organizations.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {organizationsQueryError instanceof Error ? organizationsQueryError.message : "Please retry before creating the initiative."}
              </p>
              <Button type="button" variant="outline" className="mt-3" onClick={() => queryClient.invalidateQueries({ queryKey: ["all-organizations"] })}>
                Retry
              </Button>
            </div>
          )}
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-8">
                <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                  <h2 className="mb-6 font-display text-xl font-semibold text-primary flex items-center gap-2">
                    <Building className="h-5 w-5 text-primary" /> Basic Information
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Initiative Title
                      </label>
                      <input
                        aria-label="Initiative title"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. Reforestation of Black River Gorges"
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Custom Slug (Optional)
                      </label>
                      <input
                        aria-label="Custom slug"
                        name="slug"
                        value={formData.slug}
                        onChange={handleInputChange}
                        placeholder="forest-restoration-2024"
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          Organization
                        </label>
                        <select
                          aria-label="Partner organization"
                          name="organization_id"
                          value={formData.organization_id}
                          onChange={handleInputChange}
                          className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          <option value="">Select Partner</option>
                          {organizations?.map((org) => (
                            <option key={org.id} value={org.id}>
                              {org.organization_name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">
                          Category
                        </label>
                        <select
                          aria-label="Initiative category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        >
                          {["Environment", "Education", "Community", "Health", "Animals"].map(
                            (c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ),
                          )}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                  <h2 className="mb-6 font-display text-xl font-semibold text-primary">Content</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Tagline / Caption
                      </label>
                      <input
                        aria-label="Tagline or caption"
                        name="caption"
                        value={formData.caption}
                        onChange={handleInputChange}
                        placeholder="Short catchy one-liner"
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Summary
                      </label>
                      <textarea
                        aria-label="Initiative summary"
                        name="summary"
                        value={formData.summary}
                        onChange={handleInputChange}
                        rows={3}
                        placeholder="Brief overview for listings"
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Full Story
                      </label>
                      <textarea
                        aria-label="Full initiative story"
                        name="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        rows={8}
                        placeholder="The full narrative and impact of this initiative..."
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                  <h2 className="mb-6 font-display text-xl font-semibold text-primary flex items-center gap-2">
                    <ImageIcon className="h-5 w-5 text-primary" /> Media
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Main Image URL
                      </label>
                      <input
                        aria-label="Main image URL"
                        name="image_url"
                        value={formData.image_url}
                        onChange={handleInputChange}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Gallery
                      </label>
                      <div className="space-y-3">
                        {formData.gallery_urls.map((url, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              aria-label="Gallery image URL"
                              value={url}
                              onChange={(e) => handleGalleryUrlChange(idx, e.target.value)}
                              placeholder="https://..."
                              className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <button
                              type="button"
                              aria-label="Remove gallery image"
                              onClick={() => handleRemoveGalleryUrl(idx)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={handleAddGalleryUrl}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50"
                        >
                          <Plus className="h-3 w-3" /> Add Image
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                  <h2 className="mb-6 font-display text-xl font-semibold text-primary flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" /> Financials
                  </h2>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Campaign Goal (MUR)
                    </label>
                    <input
                      aria-label="Campaign goal amount in MUR"
                      name="goal_amount_mur"
                      type="number"
                      value={formData.goal_amount_mur}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                  <h2 className="mb-6 font-display text-xl font-semibold text-primary flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" /> Goals & Outcomes
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground text-xs uppercase">
                        Short-term Goals
                      </label>
                      <textarea
                        aria-label="Short-term goals"
                        name="short_term_goals"
                        value={formData.short_term_goals}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground text-xs uppercase">
                        Long-term Vision
                      </label>
                      <textarea
                        aria-label="Long-term vision"
                        name="long_term_goals"
                        value={formData.long_term_goals}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
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
