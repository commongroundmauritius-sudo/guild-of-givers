import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/lib/community";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ReactionButtons } from "@/components/community/ReactionButtons";
import { CommentSection } from "@/components/community/CommentSection";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PostActions } from "@/components/community/PostActions";

export const Route = createFileRoute("/_authenticated/community-hub/$postId")({
  component: PostDetailPage,
});

function PostDetailPage() {
  const { postId } = Route.useParams();

  const { data: post, isLoading } = useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*, profiles(full_name, avatar_url), initiatives(title)")
        .eq("id", postId)
        .single();

      if (error) throw error;
      return data as Post;
    },
  });

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (isLoading) {
    return (
        <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-96 w-full" />
        </div>
      );
  }

  if (!post) {
    return (
        <div className="mx-auto max-w-4xl px-4 py-32 text-center">
          <h2 className="text-2xl font-bold">Post not found</h2>
          <p className="mt-2 text-muted-foreground">
            The post you are looking for might have been deleted.
          </p>
          <Button asChild className="mt-8">
            <Link to="/community-hub">Back to Community Hub</Link>
          </Button>
        </div>
      );
  }

  return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Link
          to="/community-hub"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Community Hub
        </Link>

        <article className="space-y-8">
          <header className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={post.profiles?.avatar_url || ""} />
                  <AvatarFallback>{post.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{post.profiles?.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    {post.initiatives && ` • in ${post.initiatives.title}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <PostActions post={post} redirectAfterDelete />
              </div>
            </div>

            <h1 className="text-3xl font-bold leading-tight md:text-4xl">{post.title}</h1>
          </header>

          <div className="prose prose-sm sm:prose-base max-w-none text-foreground/90">
            <p className="whitespace-pre-wrap">{post.content}</p>
          </div>

          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full rounded-xl object-cover max-h-[600px]"
            />
          )}

          <div className="flex items-center justify-between border-y py-4">
            <ReactionButtons postId={post.id} />
          </div>

          <section className="pt-8">
            <CommentSection postId={post.id} />
          </section>
        </article>
      </div>
    );
}
