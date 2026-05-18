import { Post } from "@/lib/community";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { ReactionButtons } from "./ReactionButtons";
import { Link } from "@tanstack/react-router";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center gap-4 p-4">
        <Avatar>
          <AvatarImage src={post.profiles?.avatar_url || ""} />
          <AvatarFallback>{post.profiles?.full_name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{post.profiles?.full_name || "User"}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            {post.initiatives && ` • in ${post.initiatives.title}`}
          </span>
        </div>
      </CardHeader>
      <Link to="/community-hub/$postId" params={{ postId: post.id }} className="block">
        <CardContent className="p-4 pt-0 space-y-3">
          <h3 className="font-bold text-lg leading-tight">{post.title}</h3>
          <p className="text-sm text-foreground/80 line-clamp-3">{post.content}</p>
          {post.image_url && (
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full h-64 object-cover rounded-md"
            />
          )}
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0 flex items-center justify-between border-t mt-2 pt-4">
        <ReactionButtons postId={post.id} />
        <Link
          to="/community-hub/$postId"
          params={{ postId: post.id }}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <MessageSquare className="h-4 w-4" />
          <span>{post.comments_count}</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
