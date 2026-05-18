import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Post } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Trash2, MessageCircle, Heart, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin-dashboard/community-posts")({
  component: AdminPostsPage,
});

function AdminPostsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "published" | "rejected">("all");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["admin-posts", filter],
    queryFn: async () => {
      let query = supabase
        .from("community_posts")
        .select("*, profiles(full_name, avatar_url), initiatives(title)")
        .eq("is_deleted", false)
        .order("created_at", { ascending: false });

      if (filter !== "all") {
        query = query.eq("status", filter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Post[];
    },
  });

  const moderateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("community_posts").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post status updated");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("community_posts")
        .update({ is_deleted: true, deleted_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post deleted");
    },
  });

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-12">
            <div>
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Administration
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Community Moderation
              </h1>
              <p className="mt-2 text-muted-foreground">
                Approve, reject, or remove community posts.
              </p>
            </div>

            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              {(["all", "pending", "published", "rejected"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="capitalize h-8 text-xs"
                >
                  {f}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => <Card key={i} className="h-48 w-full animate-pulse bg-muted" />)
            ) : posts.length > 0 ? (
              posts.map((post) => (
                <Card key={post.id} className="overflow-hidden">
                  <CardContent className="p-0 flex flex-col md:flex-row">
                    {post.image_url && (
                      <div className="md:w-48 h-48 bg-muted shrink-0">
                        <img
                          src={post.image_url}
                          alt={post.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={post.profiles?.avatar_url || ""} />
                              <AvatarFallback>{post.profiles?.full_name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{post.profiles?.full_name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                            </span>
                          </div>
                          <span
                            className={cn(
                              "text-[10px] font-bold uppercase px-2 py-0.5 rounded",
                              post.status === "published"
                                ? "bg-green-100 text-green-700"
                                : post.status === "pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-red-100 text-red-700",
                            )}
                          >
                            {post.status}
                          </span>
                        </div>
                        <h3 className="font-bold text-lg">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.content}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Heart className="h-3 w-3" /> {post.reactions_count}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" /> {post.comments_count}
                          </div>
                          {post.initiatives && (
                            <span className="bg-muted px-2 py-0.5 rounded">
                              {post.initiatives.title}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/community-hub/$postId" params={{ postId: post.id }}>
                              <Eye className="h-4 w-4 mr-2" /> View
                            </Link>
                          </Button>
                          {post.status !== "published" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() =>
                                moderateMutation.mutate({ id: post.id, status: "published" })
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {post.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                              onClick={() =>
                                moderateMutation.mutate({ id: post.id, status: "rejected" })
                              }
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-500"
                            onClick={() => deleteMutation.mutate(post.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 bg-card rounded-3xl border border-dashed">
                <p className="text-muted-foreground">No posts matching filter.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
