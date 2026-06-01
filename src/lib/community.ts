import { supabase } from "@/integrations/supabase/client";
import imageCompression from "browser-image-compression";

export async function compressAndUploadImage(file: File, bucket: string, userId: string) {
  const options = {
    maxSizeMB: 1,
    maxWidthOrHeight: 1920,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, compressedFile);

    if (uploadError) {
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Error compressing/uploading image:", error);
    throw error;
  }
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  image_url?: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
  initiatives?: {
    title: string;
  };
  reactions_count: number;
  comments_count: number;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: {
    full_name: string;
    avatar_url: string;
  };
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url?: string;
  category: string;
  pinned: boolean;
  created_at: string;
}

export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*")
    .eq("is_deleted", false)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Announcement[];
}

export async function fetchPosts(page = 0, limit = 20, sort = "newest") {
  let query = supabase
    .from("community_posts")
    .select("*, profiles(full_name, avatar_url), initiatives(title)")
    .eq("is_deleted", false);

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "reactions") {
    query = query.order("reactions_count", { ascending: false });
  }

  const from = page * limit;
  const to = from + limit - 1;
  const { data, error } = await query.range(from, to);

  if (error) throw error;
  return data as Post[];
}

export async function fetchComments(postId: string) {
  const { data, error } = await supabase
    .from("post_comments")
    .select("*, profiles(full_name, avatar_url)")
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Comment[];
}

export async function fetchReactions(postId: string) {
  const { data, error } = await supabase
    .from("post_reactions")
    .select("*")
    .eq("post_id", postId);

  if (error) throw error;
  return data;
}

export async function toggleReaction(postId: string, userId: string, reactionType: string) {
  const { data: existing } = await supabase
    .from("post_reactions")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .eq("reaction_type", reactionType)
    .maybeSingle();

  if (existing) {
    await supabase.from("post_reactions").delete().eq("id", existing.id);
  } else {
    await supabase.from("post_reactions").insert({
      post_id: postId,
      user_id: userId,
      reaction_type: reactionType
    });
  }
}
