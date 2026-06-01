import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { homepageService, type HomepageConfig } from "@/lib/homepage-service";
import { toast } from "sonner";

export function useHomepage(options: { includePublished?: boolean } = {}) {
  const { includePublished = false } = options;
  const queryClient = useQueryClient();

  const published = useQuery({
    queryKey: ["homepage", "published"],
    queryFn: () => homepageService.getPublishedVersion(),
    enabled: includePublished,
    // Published config changes only on explicit publish — keep it warm across
    // navigations. Mutations call queryClient.invalidateQueries to refresh.
    staleTime: 5 * 60 * 1000, // 5 min: served from cache without refetch
    gcTime: 30 * 60 * 1000, // 30 min: retained in cache after unmount
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const draft = useQuery({
    queryKey: ["homepage", "draft"],
    queryFn: () => homepageService.getDraftVersion(),
    // Draft is single-editor in practice; cache to avoid refetching when the
    // admin re-enters the CMS or remounts panels. Saves invalidate the key.
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
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
