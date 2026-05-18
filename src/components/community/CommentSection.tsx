import { Comment } from "@/lib/community";
import { useComments, useCommentMutation, useCommunityRealtime } from "@/hooks/use-community";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { MessageSquare, Reply } from "lucide-react";
import { toast } from "sonner";

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
    if (!newComment.trim()) return;

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
        onError: (error: any) => {
          toast.error(error.message || "Failed to post comment");
        },
      },
    );
  };

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
}: {
  comment: Comment;
  replies: Comment[];
  onReply: (id: string) => void;
  canReply: boolean;
}) {
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
          <p className="text-sm text-foreground/90">{comment.content}</p>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
