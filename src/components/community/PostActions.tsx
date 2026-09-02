import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { usePostEditMutation, usePostDeleteMutation } from "@/hooks/use-community";
import { isWithinEditWindow, type Post } from "@/lib/community";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PostActionsProps {
  post: Post;
  /** Where to go after a successful delete (post detail page). */
  redirectAfterDelete?: boolean;
}

export function PostActions({ post, redirectAfterDelete = false }: PostActionsProps) {
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const editMutation = usePostEditMutation();
  const deleteMutation = usePostDeleteMutation();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [title, setTitle] = useState(post.title);
  const [content, setContent] = useState(post.content);

  const isAdmin = role === "admin" || role === "super_admin";
  const isOwner = !!user && user.id === post.user_id;

  if (!isOwner && !isAdmin) return null;

  const canEdit = isOwner && isWithinEditWindow(post.created_at);
  const canDelete = isOwner || isAdmin;

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    editMutation.mutate(
      { postId: post.id, values: { title: title.trim(), content: content.trim() } },
      {
        onSuccess: () => {
          setEditOpen(false);
          toast.success("Post updated");
        },
        onError: (error: Error) => toast.error(error.message || "Failed to update post"),
      },
    );
  };

  const handleDelete = () => {
    deleteMutation.mutate(post.id, {
      onSuccess: () => {
        toast.success("Post deleted");
        setConfirmOpen(false);
        if (redirectAfterDelete) navigate({ to: "/community-hub" });
      },
      onError: (error: Error) => toast.error(error.message || "Failed to delete post"),
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Post options">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isOwner && (
            <DropdownMenuItem
              disabled={!canEdit}
              onSelect={(e) => {
                e.preventDefault();
                if (!canEdit) return;
                setTitle(post.title);
                setContent(post.content);
                setEditOpen(true);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {canEdit ? "Edit post" : "Edit window closed"}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={(e) => {
                e.preventDefault();
                setConfirmOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete post
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit post</DialogTitle>
            <DialogDescription>Posts can be edited within 1 hour of posting.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[160px]"
              placeholder="Content"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={editMutation.isPending}>
              {editMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the post from the community feed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
