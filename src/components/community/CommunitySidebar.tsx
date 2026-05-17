import { useAnnouncements } from "@/hooks/use-community";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function CommunitySidebar() {
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["community-stats"],
    queryFn: async () => {
      const [postsCount, membersCount, reactionsCount] = await Promise.all([
        supabase.from("community_posts").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "member"),
        supabase.from("post_reactions").select("*", { count: "exact", head: true }),
      ]);

      return {
        posts: postsCount.count || 0,
        members: membersCount.count || 0,
        reactions: reactionsCount.count || 0,
      };
    }
  });

  const trending = announcements.slice(0, 3);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Platform Updates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {announcementsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
          ) : trending.length > 0 ? (
            trending.map(item => (
              <div key={item.id} className="space-y-1">
                <Badge variant="outline" className="text-[10px] h-4">{item.category}</Badge>
                <p className="text-sm font-medium leading-snug hover:text-primary cursor-pointer transition-colors line-clamp-2">
                  {item.title}
                </p>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">No recent updates.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Community Stats</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {statsLoading ? (
            Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-8 w-full" />)
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Members</span>
                </div>
                <span className="font-bold">{stats?.members}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Heart className="h-4 w-4" />
                  <span>Support given</span>
                </div>
                <span className="font-bold">{stats?.reactions}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4" />
                  <span>Discussions</span>
                </div>
                <span className="font-bold">{stats?.posts}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
