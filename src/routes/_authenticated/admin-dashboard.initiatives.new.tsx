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
    caption: "",
    summary: "",
    description: "",
    content: "",
    image_url: "",
    gallery_urls: [] as string[],
    goal_amount_mur: 0,
    impact_pool_target: 0,
    impact_pool_current: 0,
    short_term_goals: "",
    long_term_goals: "",
    target_milestones: "",
    expected_outcomes: "",
    category: "",
    ngo_id: "",
    is_published: false,
  });

  useEffect(() => {
    if (!authLoading && role && role !== "admin") {
      toast.error("Unauthorized access");
      navigate({ to: "/dashboard" });
    }
  }, [role, authLoading, navigate]);

  const { data: ngos } = useQuery({
    queryKey: ["all-ngos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ngos")
        .select("id, name")
        .eq("status", "active")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (publish: boolean) => {
      const { data, error } = await supabase.from("initiatives").insert({
        ...formData,
        is_published: publish,
        is_approved: true,
        initiative_source: "admin_created",
        creator_user_id: user?.id,
        creator_role: "admin",
      }).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success("Initiative created successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-all-initiatives"] });
      navigate({ to: "/admin-dashboard/initiatives/$id/manage", params: { id: data.id } });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create initiative");
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
              <h1 className="font-display text-4xl font-semibold text-primary">
                Create New Initiative
              </h1>
              <p className="mt-2 text-muted-foreground">
                Set up a new social impact program directly as an administrator.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => createMutation.mutate(false)}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-2.5 text-sm font-bold text-primary transition hover:bg-muted disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                Save as Draft
              </button>
              <button
                onClick={() => createMutation.mutate(true)}
                disabled={createMutation.isPending}
                className="inline-flex items-center gap-2 rounded-full bg-amber-500 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-amber-600 shadow-lg shadow-amber-500/20 disabled:opacity-50"
              >
                <Globe className="h-4 w-4" />
                {createMutation.isPending ? "Creating..." : "Publish Now"}
              </button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Core Information */}
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Core Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Title</label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="Enter a compelling title"
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Category</label>
                    <input
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      placeholder="e.g. Environment, Education, Health"
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Associated NGO (Optional)</label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <select
                        name="ngo_id"
                        value={formData.ngo_id}
                        onChange={handleInputChange}
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 py-3 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 appearance-none"
                      >
                        <option value="">Select an NGO</option>
                        {ngos?.map((ngo) => (
                          <option key={ngo.id} value={ngo.id}>{ngo.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Caption (Short tagline)</label>
                    <input
                      name="caption"
                      value={formData.caption}
                      onChange={handleInputChange}
                      placeholder="e.g. Protecting Mauritius' coastal ecosystems"
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Summary</label>
                    <textarea
                      name="summary"
                      value={formData.summary}
                      onChange={handleInputChange}
                      rows={3}
                      placeholder="A brief overview for listings"
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Detailed Story</label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleInputChange}
                      rows={8}
                      placeholder="The full story and impact of this initiative..."
                      className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>
              </div>

              {/* Impact Pool & Goals */}
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Goals & Impact</h2>
                <div className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground text-xs uppercase">Short-term Goals</label>
                      <textarea
                        name="short_term_goals"
                        value={formData.short_term_goals}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground text-xs uppercase">Long-term Goals</label>
                      <textarea
                        name="long_term_goals"
                        value={formData.long_term_goals}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground text-xs uppercase">Target Milestones</label>
                      <textarea
                        name="target_milestones"
                        value={formData.target_milestones}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full rounded-2xl border border-border/40 bg-muted/30 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-muted-foreground text-xs uppercase">Expected Outcomes</label>
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
              </div>
            </div>

            <div className="space-y-8">
              {/* Media */}
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Media</h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Main Image URL</label>
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
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Gallery Images</label>
                    <div className="space-y-3">
                      {formData.gallery_urls.map((url, index) => (
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

              {/* Financials */}
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">Financials</h2>
                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-muted-foreground">Campaign Goal (MUR)</label>
                    <input
                      name="goal_amount_mur"
                      type="number"
                      value={formData.goal_amount_mur}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                  <div className="pt-4 border-t border-border/40">
                    <h3 className="mb-4 text-xs font-bold uppercase text-amber-600">Impact Pool</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">Target Amount</label>
                        <input
                          name="impact_pool_target"
                          type="number"
                          value={formData.impact_pool_target}
                          onChange={handleInputChange}
                          className="w-full rounded-xl border border-border/40 bg-muted/30 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-medium text-muted-foreground">Current Amount</label>
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
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
