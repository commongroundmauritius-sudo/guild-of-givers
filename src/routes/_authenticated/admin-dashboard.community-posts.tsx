import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Trash2, MessageCircle, Heart, Eye } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { updatePostStatus, deletePost } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/_authenticated/admin-dashboard/community-posts")({
  component: AdminPostsPage,
});

function AdminPostsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "pending" | "published" | "rejected">("all");

  const { data: posts = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-posts", filter],
    enabled: !!user && (role === "admin" || role === "super_admin"),
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
      return data as any[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      await updatePostStatus({ data: { id, status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deletePost({ data: { id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-posts"] });
      toast.success("Post deleted");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    
      <section className="bg-muted/30 py-12 min-h-screen">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-4xl font-semibold text-primary">
                Community Moderation
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage posts and ensure healthy discussions.
              </p>
            </div>
          </div>

          <div className="flex gap-2 mb-8" role="group" aria-label="Filter community posts">
            {["all", "pending", "published", "rejected"].map((f) => (
              <Button
                key={f}
                variant={filter === f ? "default" : "outline"}
                type="button"
                onClick={() => setFilter(f as any)}
                aria-pressed={filter === f}
                className="capitalize rounded-xl"
              >
                {f}
              </Button>
            ))}
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              Array(3)
                .fill(0)
                .map((_, i) => <Card key={i} className="h-40 animate-pulse bg-muted rounded-3xl" />)
            ) : isError ? (
              <Card role="alert" className="rounded-3xl border-destructive/30">
                <CardContent className="p-8 text-center">
                  <p className="font-medium">Unable to load community posts.</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {error instanceof Error ? error.message : "Please try again."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 rounded-xl"
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-posts"] })}
                  >
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : posts.length > 0 ? (
              posts.map((post: any) => (
                <Card key={post.id} className="rounded-3xl border-border/40 overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={post.profiles?.avatar_url} alt={post.profiles?.full_name ? `${post.profiles.full_name} profile photo` : "Member profile photo"} />
                        <AvatarFallback>
                          {post.profiles?.full_name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold">{post.profiles?.full_name}</span>
                          <span className="text-xs text-muted-foreground">
                            • {formatDistanceToNow(new Date(post.created_at))} ago
                          </span>
                          <Badge variant="outline" className="text-[10px] uppercase">
                            {post.status}
                          </Badge>
                        </div>
                        {post.initiatives?.title && (
                          <div className="text-xs text-primary font-medium mb-2 flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {post.initiatives.title}
                          </div>
                        )}
                        <h3 className="font-bold text-lg mb-2">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {post.content}
                        </p>

                        <div className="flex items-center gap-6 text-muted-foreground">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Heart className="h-4 w-4" /> {post.reactions_count}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs">
                            <MessageCircle className="h-4 w-4" /> {post.comments_count}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        {post.status !== "published" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: post.id, status: "published" })
                            }
                          >
                            <CheckCircle className="h-4 w-4 mr-2" /> Approve
                          </Button>
                        )}
                        {post.status !== "rejected" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: post.id, status: "rejected" })
                            }
                          >
                            <XCircle className="h-4 w-4 mr-2" /> Reject
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-red-500 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(post.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-20 border-2 border-dashed rounded-[2.5rem]">
                <p className="text-muted-foreground">No posts matching this filter.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    
  );
}
