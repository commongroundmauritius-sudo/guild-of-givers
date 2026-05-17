import { Button } from "@/components/ui/button";
import { usePostMutation, useReactionMutation, useReactions } from "@/hooks/use-community";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { Heart, PartyPopper, Lightbulb, HandHeart } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const REACTIONS = [
  { type: "Support", emoji: "❤️", icon: Heart, label: "Support", color: "text-red-500" },
  { type: "Celebrate", emoji: "👏", icon: PartyPopper, label: "Celebrate", color: "text-amber-500" },
  { type: "Idea", emoji: "💡", icon: Lightbulb, label: "Idea", color: "text-yellow-500" },
  { type: "Thanks", emoji: "🙏", icon: HandHeart, label: "Thanks", color: "text-blue-500" },
];

interface ReactionButtonsProps {
  postId: string;
}

export function ReactionButtons({ postId }: ReactionButtonsProps) {
  const { user, role } = useAuth();
  const { data: reactions = [] } = useReactions(postId);
  const mutation = useReactionMutation(postId);

  const userReaction = reactions.find(r => r.user_id === user?.id);
  const counts = reactions.reduce((acc, r) => {
    acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const canReact = role === "member" || role === "admin";

  const handleReaction = (type: string) => {
    if (!user || !canReact) return;
    mutation.mutate({ userId: user.id, reactionType: type });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <TooltipProvider>
        {REACTIONS.map(({ type, emoji, label, color }) => {
          const isActive = userReaction?.reaction_type === type;
          const count = counts[type] || 0;

          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <Button
                  variant={isActive ? "secondary" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 gap-1 px-2",
                    isActive && "bg-secondary border-secondary",
                    !canReact && "opacity-50 cursor-not-allowed"
                  )}
                  onClick={() => handleReaction(type)}
                  disabled={!canReact || mutation.isPending}
                >
                  <span className="text-lg">{emoji}</span>
                  {count > 0 && <span className="text-xs font-medium">{count}</span>}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{label}</TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}
