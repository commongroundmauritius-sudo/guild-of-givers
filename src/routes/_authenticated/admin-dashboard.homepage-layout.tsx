import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { useHomepage } from "@/hooks/use-homepage";
import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Home, Save, Send, Eye, Layout, Move, Info, Loader2 } from "lucide-react";
import { SectionItem } from "@/components/dashboard/modules/homepage/components/SectionItem";
import { HomepagePreview } from "@/components/dashboard/modules/homepage/HomepagePreview";
import { DEFAULT_HOMEPAGE_CONFIG } from "@/lib/homepage-service";
import { cn } from "@/lib/utils";

const HeroPanel = lazy(() =>
  import("@/components/dashboard/modules/homepage/components/HeroPanel").then((m) => ({
    default: m.HeroPanel,
  })),
);
const FeaturedInitiativesPanel = lazy(() =>
  import("@/components/dashboard/modules/homepage/components/FeaturedInitiativesPanel").then(
    (m) => ({ default: m.FeaturedInitiativesPanel }),
  ),
);
const SuccessStoriesManager = lazy(() =>
  import("@/components/dashboard/modules/homepage/components/SuccessStoriesManager").then((m) => ({
    default: m.SuccessStoriesManager,
  })),
);
const ImpactMetricsPanel = lazy(() =>
  import("@/components/dashboard/modules/homepage/components/ImpactMetricsPanel").then((m) => ({
    default: m.ImpactMetricsPanel,
  })),
);
const VolunteerOpportunitiesPanel = lazy(() =>
  import("@/components/dashboard/modules/homepage/components/VolunteerOpportunitiesPanel").then(
    (m) => ({ default: m.VolunteerOpportunitiesPanel }),
  ),
);
const UrgentNeedsPanel = lazy(() =>
  import("@/components/dashboard/modules/homepage/components/UrgentNeedsPanel").then((m) => ({
    default: m.UrgentNeedsPanel,
  })),
);
const TrendingProgramsPanel = lazy(() =>
  import("@/components/dashboard/modules/homepage/components/TrendingProgramsPanel").then((m) => ({
    default: m.TrendingProgramsPanel,
  })),
);
const FAQPanel = lazy(() =>
  import("@/components/dashboard/modules/homepage/components/FAQPanel").then((m) => ({
    default: m.FAQPanel,
  })),
);

const PanelFallback = () => (
  <div className="flex items-center justify-center py-20 text-muted-foreground">
    <Loader2 className="h-6 w-6 animate-spin" />
  </div>
);

const CMSLoadingState = () => (
  <SiteLayout>
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="relative">
        <div className="h-12 w-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <Home className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="font-display text-xl font-bold text-primary">Loading Homepage CMS</h3>
        <p className="text-muted-foreground animate-pulse">
          Syncing configuration with database...
        </p>
      </div>
    </div>
  </SiteLayout>
);

export const Route = createFileRoute("/_authenticated/admin-dashboard/homepage-layout")({
  component: HomepageCMS,
});

function HomepageCMS() {
  const { user } = useAuth();
  const { draft, published, saveDraft, publish, isSaving, isPublishing } = useHomepage({
    includePublished: true,
  });
  const [config, setConfig] = useState<any>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    // Priority 1: Draft version if it exists
    if (draft.data?.configuration_json) {
      setConfig(draft.data.configuration_json);
    }
    // Priority 2: Published version if no draft
    else if (published.data?.configuration_json) {
      setConfig(published.data.configuration_json);
    }
    // Priority 3: Default fallback if neither exist (e.g. fresh installation)
    else if (!draft.isLoading && !published.isLoading) {
      setConfig(DEFAULT_HOMEPAGE_CONFIG);
    }
  }, [draft.data, published.data, draft.isLoading, published.isLoading]);

  const handleToggle = (id: string, visible: boolean) => {
    if (!config) return;
    const updatedSections = config.sections.map((s: any) => (s.id === id ? { ...s, visible } : s));
    setConfig({ ...config, sections: updatedSections });
  };

  const handleUpdateSettings = (id: string, settings: any) => {
    if (!config) return;
    const updatedSections = config.sections.map((s: any) => (s.id === id ? { ...s, settings } : s));
    setConfig({ ...config, sections: updatedSections });
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    if (!config) return;
    const newSections = [...config.sections];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;

    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setConfig({ ...config, sections: newSections });
  };

  const onSave = () => {
    if (config && user) {
      saveDraft({ config, userId: user.id });
    }
  };

  const onPublish = () => {
    if (draft.data?.id) {
      publish(draft.data.id);
    } else if (published.data?.id) {
      // If they are publishing the "published" config (e.g. they modified
      // it but didn't save draft), we'll save it as draft first then publish.
      // But usually, clicking 'Publish' should use the current ID.
      // In this CMS flow, draft is created on the first 'Save Draft'.
      // For safety, let's toast a message if they try to publish without a draft.
      onSave();
      // Success handler in hook will invalidate and we can publish then.
      // But simpler: just use onSave first.
    }
  };

  // Show professional loading state while fetching initial data
  if (!config && (draft.isLoading || published.isLoading)) {
    return <CMSLoadingState />;
  }

  // Handle case where config is still null after loading (shouldn't happen with fallback)
  if (!config) return <CMSLoadingState />;

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-6 mb-12">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Administration
                </span>
              </div>
              <h1 className="font-display text-4xl font-bold text-primary">Homepage CMS</h1>
              <p className="text-muted-foreground">
                Control structure, visibility, and content of the public homepage.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="rounded-full gap-2 bg-white"
                onClick={() => setIsPreviewOpen(true)}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
              <Button
                variant="outline"
                className="rounded-full gap-2 bg-white"
                onClick={onSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                {isSaving ? "Saving..." : "Save Draft"}
              </Button>
              <Button
                className="rounded-full gap-2 bg-primary shadow-lg shadow-primary/20"
                onClick={onPublish}
                disabled={isPublishing || !draft.data?.id}
                title={!draft.data?.id ? "Save a draft first to publish" : ""}
              >
                <Send className="h-4 w-4" />
                {isPublishing ? "Publishing..." : "Publish Changes"}
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-[2.5rem] border-border/40 shadow-sm overflow-hidden">
                <CardHeader className="bg-white border-b border-border/40 py-6">
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Layout className="h-5 w-5 text-primary" />
                    Page Structure
                  </CardTitle>
                  <CardDescription>
                    Toggle visibility and use arrows to reorder sections.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-3 bg-muted/20">
                  {config.sections.map((section: any, index: number) => (
                    <SectionItem
                      key={section.id}
                      id={section.id}
                      label={section.id.charAt(0).toUpperCase() + section.id.slice(1)}
                      visible={section.visible}
                      onToggle={(visible) => handleToggle(section.id, visible)}
                      onConfigure={() => setActiveSectionId(section.id)}
                      onMoveUp={() => handleMove(index, "up")}
                      onMoveDown={() => handleMove(index, "down")}
                      isFirst={index === 0}
                      isLast={index === config.sections.length - 1}
                    />
                  ))}
                </CardContent>
              </Card>

              <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                <div className="flex gap-4">
                  <div className="bg-primary/10 p-2 rounded-xl h-fit">
                    <Info className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold text-primary">CMS Instructions</h4>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                      Changes are saved as a draft. Click 'Publish' to make them live. Sections can
                      be customized by clicking 'Configure'.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2">
              <Card className="rounded-[2.5rem] border-border/40 shadow-sm min-h-[600px]">
                {activeSectionId ? (
                  <>
                    <CardHeader className="border-b border-border/40">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl font-bold text-primary">
                            Configure{" "}
                            {activeSectionId.charAt(0).toUpperCase() + activeSectionId.slice(1)}
                          </CardTitle>
                          <CardDescription>Customize settings for this section.</CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          onClick={() => setActiveSectionId(null)}
                          className="rounded-xl"
                        >
                          Close
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-8">
                      <Suspense fallback={<PanelFallback />}>
                        {activeSectionId === "hero" && (
                          <HeroPanel
                            settings={config.sections.find((s: any) => s.id === "hero")?.settings}
                            onUpdate={(s) => handleUpdateSettings("hero", s)}
                          />
                        )}
                        {activeSectionId === "featured" && (
                          <FeaturedInitiativesPanel
                            settings={
                              config.sections.find((s: any) => s.id === "featured")?.settings
                            }
                            onUpdate={(s) => handleUpdateSettings("featured", s)}
                          />
                        )}
                        {activeSectionId === "stats" && (
                          <ImpactMetricsPanel
                            settings={config.sections.find((s: any) => s.id === "stats")?.settings}
                            onUpdate={(s) => handleUpdateSettings("stats", s)}
                          />
                        )}
                        {activeSectionId === "volunteers" && (
                          <VolunteerOpportunitiesPanel
                            settings={
                              config.sections.find((s: any) => s.id === "volunteers")?.settings
                            }
                            onUpdate={(s) => handleUpdateSettings("volunteers", s)}
                          />
                        )}
                        {activeSectionId === "urgent" && (
                          <UrgentNeedsPanel
                            settings={config.sections.find((s: any) => s.id === "urgent")?.settings}
                            onUpdate={(s) => handleUpdateSettings("urgent", s)}
                          />
                        )}
                        {activeSectionId === "trending" && (
                          <TrendingProgramsPanel
                            settings={
                              config.sections.find((s: any) => s.id === "trending")?.settings
                            }
                            onUpdate={(s) => handleUpdateSettings("trending", s)}
                          />
                        )}
                        {activeSectionId === "success" && <SuccessStoriesManager />}
                        {activeSectionId === "faq" && (
                          <FAQPanel
                            settings={config.sections.find((s: any) => s.id === "faq")?.settings}
                            onUpdate={(s) => handleUpdateSettings("faq", s)}
                          />
                        )}
                      </Suspense>
                      {![
                        "hero",
                        "featured",
                        "success",
                        "stats",
                        "volunteers",
                        "urgent",
                        "trending",
                        "faq",
                      ].includes(activeSectionId) && (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                          <Layout className="h-12 w-12 mb-4 opacity-20" />
                          <p>
                            Settings for <strong>{activeSectionId}</strong> coming soon.
                          </p>
                          <p className="text-sm">
                            Visibility and ordering controls are available in the sidebar.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-20 text-center text-muted-foreground">
                    <Move className="h-12 w-12 mb-4 opacity-20" />
                    <h3 className="text-xl font-bold text-primary/40">Select a Section</h3>
                    <p className="max-w-xs mx-auto mt-2">
                      Click 'Configure' on any section in the sidebar to manage its content and
                      settings.
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>
      </section>

      <HomepagePreview
        config={config}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </SiteLayout>
  );
}
