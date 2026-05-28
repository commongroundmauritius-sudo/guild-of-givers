import { useQuery } from "@tanstack/react-query";
import { initiativeService } from "@/lib/initiatives/initiative-service";

export function useCuratedInitiatives() {
  const featured = useQuery({
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
    queryKey: ["initiatives", "newest"],
    queryFn: () => initiativeService.getNewest(),
  });
  return {
    featured,
    urgent,
    trending,
    newest,
    isLoading: featured.isLoading || urgent.isLoading || trending.isLoading || newest.isLoading,
  };
}
