import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { usePostMutation } from "@/hooks/use-community";
import { compressAndUploadImage } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus, X, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function CreatePostForm() {
  const { user, role } = useAuth();
  const mutation = usePostMutation();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [initiativeId, setInitiativeId] = useState<string | null>(null);

  const { data: initiatives = [] } = useQuery({
    queryKey: ["initiatives-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("id, title")
        .eq("status", "active");
      return data || [];
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/jpeg", "image/jpg", "image/webp"];
      if (!validTypes.includes(file.type)) {
        toast.error("Only JPG, JPEG, and WEBP formats are allowed");
        return;
      }
      if (file.size > 3 * 1024 * 1024) {
        toast.error("Image size must be less than 3MB");
        return;
      }
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImage(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !content.trim()) return;

    setUploading(true);
    try {
      let imageUrl = null;
      if (image) {
        imageUrl = await compressAndUploadImage(image, "community-posts", user.id);
      }

      await mutation.mutateAsync({
        user_id: user.id,
        title,
        content,
        image_url: imageUrl,
        initiative_id: initiativeId === "none" ? null : initiativeId,
      });

      toast.success("Post submitted!");
      setTitle("");
      setContent("");
      setImage(null);
      setPreviewUrl(null);
      setInitiativeId(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to create post");
    } finally {
      setUploading(false);
    }
  };

  if (role === "organization" || !role) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Share with the Community</CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <Input
            placeholder="Post Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <select
            className="w-full h-10 px-3 py-2 rounded-md border border-input bg-transparent text-sm"
            value={initiativeId || "none"}
            onChange={(e) => setInitiativeId(e.target.value)}
          >
            <option value="none">Link to an Initiative (Optional)</option>
            {initiatives.map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </select>

          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
            required
          />

          {previewUrl && (
            <div className="relative">
              <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-md" />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 rounded-full"
                onClick={removeImage}
                type="button"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between border-t pt-4">
          <div className="relative">
            <input
              type="file"
              id="post-image"
              className="hidden"
              accept="image/jpeg,image/jpg,image/webp"
              onChange={handleImageChange}
            />
            <label htmlFor="post-image">
              <Button variant="outline" type="button" asChild>
                <span className="cursor-pointer gap-2">
                  <ImagePlus className="h-4 w-4" />
                  Add Image
                </span>
              </Button>
            </label>
          </div>
          <Button type="submit" disabled={uploading || mutation.isPending}>
            <Send className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Post"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
