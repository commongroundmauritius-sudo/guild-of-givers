import { Comment, isWithinEditWindow } from "@/lib/community";
import {
  useComments,
  useCommentMutation,
  useCommentEditMutation,
  useCommentDeleteMutation,
  useCommunityRealtime,
} from "@/hooks/use-community";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { MessageSquare, Reply, Pencil, Trash2, Check, X } from "lucide-react";
import { toast } from "sonner";
import { commentSchema } from "@/lib/security/validators";

interface CommentSectionProps {
  postId: string;
}

export function CommentSection({ postId }: CommentSectionProps) {
  const { user, role } = useAuth();
  const { data: comments = [], isLoading } = useComments(postId);
  const mutation = useCommentMutation(postId);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);

  useCommunityRealtime(["comments", postId], "post_comments", `post_id=eq.${postId}`);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const validation = commentSchema.safeParse({
      post_id: postId,
      content: newComment,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    mutation.mutate(
      {
        post_id: postId,
        user_id: user.id,
        content: newComment,
        parent_comment_id: replyTo,
      },
      {
        onSuccess: () => {
          setNewComment("");
          setReplyTo(null);
          toast.success("Comment posted!");
        },
        onError: (error: Error) => {
          toast.error(error.message || "Failed to post comment");
        },
      },
    );
  };

  const editMutation = useCommentEditMutation(postId);
  const deleteMutation = useCommentDeleteMutation(postId);
  const isAdmin = role === "admin" || role === "super_admin";

  const mainComments = comments.filter((c) => !c.parent_comment_id);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_comment_id === parentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 font-semibold">
        <MessageSquare className="h-5 w-5" />
        <span>Comments ({comments.length})</span>
      </div>

      {user ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          {replyTo && (
            <div className="flex items-center justify-between bg-muted p-2 rounded-md text-xs">
              <span>Replying to a comment</span>
              <Button variant="ghost" size="sm" onClick={() => setReplyTo(null)}>
                Cancel
              </Button>
            </div>
          )}
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button type="submit" disabled={mutation.isPending || !newComment.trim()}>
              {mutation.isPending ? "Posting..." : "Post Comment"}
            </Button>
          </div>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4 border rounded-md">
          Please sign in to join the discussion.
        </p>
      )}

      <div className="space-y-6">
        {mainComments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            replies={getReplies(comment.id)}
            onReply={setReplyTo}
            canReply={!!user}
            currentUserId={user?.id ?? null}
            isAdmin={isAdmin}
            onEdit={(id, content) =>
              editMutation.mutate(
                { commentId: id, content },
                {
                  onSuccess: () => toast.success("Comment updated"),
                  onError: (error: Error) => toast.error(error.message || "Failed to update"),
                },
              )
            }
            onDelete={(id) =>
              deleteMutation.mutate(id, {
                onSuccess: () => toast.success("Comment deleted"),
                onError: (error: Error) => toast.error(error.message || "Failed to delete"),
              })
            }
          />
        ))}
        {mainComments.length === 0 && !isLoading && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No comments yet. Be the first to share your thoughts!
          </p>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  replies,
  onReply,
  canReply,
  currentUserId,
  isAdmin,
  onEdit,
  onDelete,
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string) => void;
  canReply: boolean;
  currentUserId: string | null;
  isAdmin: boolean;
  onEdit: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);

  const isOwner = !!currentUserId && currentUserId === comment.user_id;
  const canEdit = isOwner && isWithinEditWindow(comment.created_at);
  const canDelete = isOwner || isAdmin;

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={comment.profiles?.avatar_url || ""} />
          <AvatarFallback>{comment.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">{comment.profiles?.full_name || "User"}</span>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    if (!draft.trim()) return;
                    onEdit(comment.id, draft.trim());
                    setIsEditing(false);
                  }}
                >
                  <Check className="h-3 w-3 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setDraft(comment.content);
                    setIsEditing(false);
                  }}
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-foreground/90">{comment.content}</p>
          )}

          {!isEditing && (
            <div className="flex items-center gap-3">
              {canReply && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => onReply(comment.id)}
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Reply
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div className="ml-11 space-y-4 border-l pl-4">
          {replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              replies={[]}
              onReply={onReply}
              canReply={canReply}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
