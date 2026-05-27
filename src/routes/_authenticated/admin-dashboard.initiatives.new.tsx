import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { generateUniqueInitiativeSlug } from "@/lib/slugify";
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
  Link as LinkIcon
} from "lucide-react";

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
    if (!authLoading && role && role !== "admin") {
      toast.error("Unauthorized access");
      navigate({ to: "/dashboard" });
    }
  }, [role, authLoading, navigate]);

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

  const createMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const slug = await generateUniqueInitiativeSlug(formData.title);
      const { data, error } = await supabase
        .from("initiatives")
        .insert({
          ...formData,
          is_published: publish,
          is_approved: true,
          initiative_source: "admin_created",
          creator_user_id: user?.id,
          creator_role: "admin",
          slug: formData.slug || slug
        })
        .select()
        .single();

      if (error) throw error;
      return data;
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
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <Link
            to="/admin-dashboard/initiatives"
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Initiatives
          </Link>

          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  New Initiative
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Create Impact Program
              </h1>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => createMutation.mutate(false)}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-primary transition hover:bg-muted"
              >
                <Save className="h-4 w-4" />
                Save as Draft
              </button>
              <button
                onClick={() => createMutation.mutate(true)}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                <Globe className="h-4 w-4" />
                Publish Directly
              </button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-8">
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                  Core Information
                </h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Title
                    </label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Coral Reef Restoration"
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <LinkIcon className="h-3 w-3" /> Custom Slug (Optional)
                    </label>
                    <input
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="e.g. reef-restoration"
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground">
                        Organization
                      </label>
                      <select
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
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        {["Environment", "Education", "Community", "Health", "Animals"].map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
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

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
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
                              value={url}
                              onChange={(e) => handleGalleryUrlChange(idx, e.target.value)}
                              placeholder="https://..."
                              className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                            />
                            <button
                              type="button"
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
              </div>

              <div className="space-y-8">
                <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                  <h2 className="mb-6 font-display text-xl font-semibold text-primary flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" /> Financials
                  </h2>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">
                      Campaign Goal (MUR)
                    </label>
                    <input
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
