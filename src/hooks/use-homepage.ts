import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { homepageService, type HomepageConfig } from "@/lib/homepage-service";
import { toast } from "sonner";

export function useHomepage() {
  const queryClient = useQueryClient();

  const published = useQuery({
    queryKey: ["homepage", "published"],
    queryFn: () => homepageService.getPublishedVersion(),
  });

  const draft = useQuery({
    queryKey: ["homepage", "draft"],
    queryFn: () => homepageService.getDraftVersion(),
  });

  const saveDraftMutation = useMutation({
    mutationFn: ({ config, userId }: { config: HomepageConfig; userId: string }) =>
      homepageService.saveDraft(config, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage", "draft"] });
      toast.success("Draft saved successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to save draft: " + error.message);
    },
  });

  const publishMutation = useMutation({
    mutationFn: (versionId: string) => homepageService.publishVersion(versionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["homepage"] });
      toast.success("Homepage published successfully");
    },
    onError: (error: any) => {
      toast.error("Failed to publish: " + error.message);
    },
  });

  return {
    published,
    draft,
    saveDraft: saveDraftMutation.mutate,
    isSaving: saveDraftMutation.isPending,
    publish: publishMutation.mutate,
    isPublishing: publishMutation.isPending,
  };
}
