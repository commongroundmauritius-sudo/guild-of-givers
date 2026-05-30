import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import imageCompression from "browser-image-compression";
import { validateFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE } from "./security/fileValidation";

export type Post = Database["public"]["Tables"]["community_posts"]["Row"] & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  initiatives: {
    title: string;
  } | null;
};

export type Announcement = Database["public"]["Tables"]["announcements"]["Row"] & {
  profiles: {
    full_name: string | null;
  } | null;
};

export type Comment = Database["public"]["Tables"]["post_comments"]["Row"] & {
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

export async function compressAndUploadImage(file: File, bucket: string, path: string) {
  // Defensive check
  const validation = await validateFile(file, ALLOWED_IMAGE_TYPES, MAX_IMAGE_SIZE);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  const options = {
    maxSizeMB: 3,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    // Sanitize filename by removing potentially dangerous characters
    // and ensuring a single controlled extension
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeBaseName = file.name
      .split(".")
      .slice(0, -1)
      .join(".")
      .replace(/[^a-zA-Z0-9-]/g, "_")
      .substring(0, 50);

    const fileName = `${path}/${Date.now()}-${safeBaseName}.${extension}`;

    const { data, error } = await supabase.storage.from(bucket).upload(fileName, compressedFile);

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path);

    return publicUrl;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
}

export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from("announcements")
    .select("*, profiles(full_name)")
    .eq("is_deleted", false)
    .order("pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Announcement[];
}

export async function fetchPosts(
  page = 0,
  pageSize = 20,
  sort: "newest" | "active" | "reactions" = "newest",
) {
  let query = supabase
    .from("community_posts")
    .select("*, profiles(full_name, avatar_url), initiatives(title)")
    .eq("is_deleted", false)
    .eq("status", "published");

  if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "active") {
    query = query.order("comments_count", { ascending: false });
  } else if (sort === "reactions") {
    query = query.order("reactions_count", { ascending: false });
  }

  const { data, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

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
    .select("reaction_type, user_id")
    .eq("post_id", postId);

  if (error) throw error;
  return data;
}

export async function toggleReaction(postId: string, userId: string, reactionType: string) {
  const { data: existing } = await supabase
    .from("post_reactions")
    .select("*")
    .eq("post_id", postId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    if (existing.reaction_type === reactionType) {
      // Remove reaction
      return supabase.from("post_reactions").delete().eq("id", existing.id);
    } else {
      // Update reaction
      return supabase
        .from("post_reactions")
        .update({ reaction_type: reactionType })
        .eq("id", existing.id);
    }
  } else {
    // Add reaction
    return supabase
      .from("post_reactions")
      .insert({ post_id: postId, user_id: userId, reaction_type: reactionType });
  }
}
