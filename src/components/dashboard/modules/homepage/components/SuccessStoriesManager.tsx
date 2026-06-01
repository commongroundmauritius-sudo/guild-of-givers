import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { successStoryService } from "@/lib/success-story-service";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Edit2, CheckCircle2, Circle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function SuccessStoriesManager() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStory, setEditingStory] = useState<any>(null);

  const { data: stories = [], isLoading } = useQuery({
    queryKey: ["success-stories"],
    queryFn: () => successStoryService.getAll(),
  });

  const mutation = useMutation({
    mutationFn: (story: any) =>
      story.id
        ? successStoryService.update(story.id, story)
        : successStoryService.create(story),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["success-stories"] });
      setIsDialogOpen(false);
      setEditingStory(null);
      toast.success("Success story saved");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => successStoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["success-stories"] });
      toast.success("Success story deleted");
    },
  });

  const handleEdit = (story: any) => {
    setEditingStory(story);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-primary">Manage Success Stories</h3>
        <Button onClick={() => setIsDialogOpen(true)} className="rounded-full gap-2">
          <Plus className="h-4 w-4" /> Add Story
        </Button>
      </div>

      <div className="grid gap-4">
        {stories.map((story: any) => (
          <div key={story.id} className="flex items-center gap-4 p-4 bg-white border rounded-2xl shadow-sm">
            {story.image_url && (
              <img src={story.image_url} className="h-12 w-12 rounded-xl object-cover" alt="" />
            )}
            <div className="flex-1">
              <h4 className="font-bold text-primary">{story.title}</h4>
              <p className="text-xs text-muted-foreground line-clamp-1">{story.summary}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(story)}
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate(story.id)}
                className="h-8 w-8 text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem]">
          <DialogHeader>
            <DialogTitle>{editingStory ? "Edit Success Story" : "New Success Story"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                defaultValue={editingStory?.title}
                onChange={(e) => setEditingStory({ ...editingStory, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Summary</Label>
              <Textarea
                defaultValue={editingStory?.summary}
                onChange={(e) => setEditingStory({ ...editingStory, summary: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                defaultValue={editingStory?.image_url}
                onChange={(e) => setEditingStory({ ...editingStory, image_url: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>CTA Link</Label>
              <Input
                defaultValue={editingStory?.cta_link}
                onChange={(e) => setEditingStory({ ...editingStory, cta_link: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Label>Published</Label>
              <input
                type="checkbox"
                defaultChecked={editingStory?.is_published}
                onChange={(e) => setEditingStory({ ...editingStory, is_published: e.target.checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => mutation.mutate(editingStory)} disabled={mutation.isPending}>
              Save Story
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
