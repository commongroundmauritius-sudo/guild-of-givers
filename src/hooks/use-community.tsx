import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  fetchAnnouncements,
  fetchPosts,
  fetchComments,
  fetchReactions,
  toggleReaction,
  Post,
  Comment,
  Announcement
} from "@/lib/community";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAnnouncements() {
  return useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
  });
}

export function usePosts(page = 0, sort: 'newest' | 'active' | 'reactions' = 'newest') {
  return useQuery({
    queryKey: ["posts", page, sort],
    queryFn: () => fetchPosts(page, 20, sort),
  });
}

export function useComments(postId: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => fetchComments(postId),
    enabled: !!postId,
  });
}

export function useReactions(postId: string) {
  return useQuery({
    queryKey: ["reactions", postId],
    queryFn: () => fetchReactions(postId),
    enabled: !!postId,
  });
}

export function useCommunityRealtime(queryKey: any[], table: string, filter?: string) {
  const queryClient = useQueryClient();

  // Memoize queryKey to prevent unnecessary re-subscriptions
  const memoizedQueryKey = useMemo(() => queryKey, [...queryKey]);

  useEffect(() => {
    const channel = supabase
      .channel(`community-${table}-${Math.random().toString(36).substring(7)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        () => {
          queryClient.invalidateQueries({ queryKey: memoizedQueryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, memoizedQueryKey, table, filter]);
}

export function usePostMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newPost: any) => {
      const { data, error } = await supabase.from("community_posts").insert(newPost).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useCommentMutation(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (newComment: any) => {
      const { data, error } = await supabase.from("post_comments").insert(newComment).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comments", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useReactionMutation(postId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, reactionType }: { userId: string, reactionType: string }) =>
      toggleReaction(postId, userId, reactionType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reactions", postId] });
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
