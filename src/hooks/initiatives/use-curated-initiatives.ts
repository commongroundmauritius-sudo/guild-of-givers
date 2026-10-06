import { useQuery } from "@tanstack/react-query";
import { initiativeService } from "@/lib/initiatives/initiative-service";

export function useCuratedInitiatives(options: { includeFeatured?: boolean; includeNewest?: boolean } = {}) {
  const { includeFeatured = true, includeNewest = true } = options;
  const featured = useQuery({
    enabled: includeFeatured,
    queryKey: ["initiatives", "featured"],
    queryFn: () => initiativeService.getFeatured(),
  });
  const urgent = useQuery({
    queryKey: ["initiatives", "urgent"],
    queryFn: () => initiativeService.getUrgent(),
  });
  const trending = useQuery({
    queryKey: ["initiatives", "trending"],
    queryFn: () => initiativeService.getTrending(),
  });
  const newest = useQuery({
    enabled: includeNewest,
    queryKey: ["initiatives", "newest"],
    queryFn: () => initiativeService.getNewest(),
  });
  return {
    featured,
    urgent,
    trending,
    newest,
    isLoading: urgent.isLoading || trending.isLoading || (includeFeatured && featured.isLoading) || (includeNewest && newest.isLoading),
  };
}
