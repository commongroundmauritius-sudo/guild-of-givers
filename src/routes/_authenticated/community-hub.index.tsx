import { createFileRoute } from "@tanstack/react-router";
import { AnnouncementCard } from "@/components/community/AnnouncementCard";
import { PostCard } from "@/components/community/PostCard";
import { CreatePostForm } from "@/components/community/CreatePostForm";
import { CommunitySidebar } from "@/components/community/CommunitySidebar";
import { useAnnouncements, usePosts, useCommunityRealtime } from "@/hooks/use-community";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/community-hub/")({
  component: CommunityHubPage,
});

function CommunityHubPage() {
  const [sort, setSort] = useState<"newest" | "active" | "reactions">("newest");
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements();
  const { data: posts = [], isLoading: postsLoading } = usePosts(0, sort);

  useCommunityRealtime(
    ["posts", 0, sort],
    "community_posts",
    "is_deleted=eq.false,status=eq.published",
  );
  useCommunityRealtime(["announcements"], "announcements", "is_deleted=eq.false");

  const pinnedAnnouncements = announcements.filter((a) => a.pinned);
  const recentAnnouncements = announcements.filter((a) => !a.pinned).slice(0, 5);

  return (
    <div className="min-h-screen">
      <div className="bg-muted/30 border-b">
        <div className="mx-auto max-w-7xl px-4 py-12 md:py-16 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Community Hub
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            A space for members to share experiences, discuss initiatives, and stay updated on our
            collective impact.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-8 space-y-8">
            {/* Announcements Section */}
            {(pinnedAnnouncements.length > 0 || announcementsLoading) && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Announcements
                </h2>
                <div className="grid gap-4">
                  {announcementsLoading ? (
                    <Skeleton className="h-48 w-full" />
                  ) : (
                    pinnedAnnouncements.map((a) => <AnnouncementCard key={a.id} announcement={a} />)
                  )}
                </div>
              </section>
            )}

            {/* Create Post */}
            <CreatePostForm />

            {/* Discussion Feed */}
            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold">Community Feed</h2>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-md">
                  <Button
                    variant={sort === "newest" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSort("newest")}
                    className="h-8 text-xs"
                  >
                    Newest
                  </Button>
                  <Button
                    variant={sort === "active" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSort("active")}
                    className="h-8 text-xs"
                  >
                    Most Active
                  </Button>
                  <Button
                    variant={sort === "reactions" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setSort("reactions")}
                    className="h-8 text-xs"
                  >
                    Popular
                  </Button>
                </div>
              </div>

              <div className="grid gap-6">
                {postsLoading ? (
                  Array(3)
                    .fill(0)
                    .map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
                ) : posts.length > 0 ? (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <Card className="p-12 text-center border-dashed">
                    <p className="text-muted-foreground">No posts yet. Start the conversation!</p>
                  </Card>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <CommunitySidebar />
          </div>
        </div>
      </div>
    </div>
  );
}
