import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Globe, EyeOff, Image as ImageIcon, Plus, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin-initiatives/$id")({
  component: InitiativeEditPage,
});

function InitiativeEditPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<any>(null);

  const { data: initiative, isLoading } = useQuery({
    queryKey: ["initiative", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*, ngos(name)")
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
        goal_amount_mur: initiative.goal_amount_mur || 0,
        image_url: initiative.image_url || "",
        gallery_urls: initiative.gallery_urls || [],
        is_published: initiative.is_published || false,
      });
    }
  }, [initiative]);

  const updateMutation = useMutation({
    mutationFn: async (updatedData: any) => {
      const { error } = await supabase.from("initiatives").update(updatedData).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Initiative updated successfully");
      queryClient.invalidateQueries({ queryKey: ["initiative", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-all-initiatives"] });
    },
    onError: (error: any) => {
      toast.error("Failed to update: " + error.message);
    },
  });

  if (isLoading || !formData) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-7xl px-4 py-16 text-center">Loading initiative...</div>
      </SiteLayout>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleTogglePublished = () => {
    setFormData((prev: any) => ({ ...prev, is_published: !prev.is_published }));
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
    const newUrls = formData.gallery_urls.filter((_: any, i: number) => i !== index);
    setFormData((prev: any) => ({ ...prev, gallery_urls: newUrls }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  return (
    <SiteLayout>
      <section className="min-h-screen bg-cream-soft/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate({ to: "/_authenticated/admin" })}
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
                <span className="font-medium text-primary">{(initiative.ngos as any)?.name}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
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
              {/* Basic Info */}
              <div className="rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
                <h2 className="mb-6 font-display text-xl font-semibold text-primary">
                  General Information
                </h2>
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

              {/* Detailed Content */}
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
              {/* Media */}
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

              {/* Funding */}
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
