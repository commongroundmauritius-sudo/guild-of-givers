import React from "react";
import { Badge } from "@/components/ui/badge";
import { intelligenceService } from "@/lib/crm/intelligence-service";
import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const EngagementBadge: React.FC<{ userId: string }> = ({ userId }) => {
  const { data: score, isLoading } = useQuery({
    queryKey: ["engagement-score", userId],
    queryFn: () => intelligenceService.getLatestEngagementScore(userId),
  });

  if (isLoading || !score) return null;

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Elite":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "High":
        return "bg-green-100 text-green-800 border-green-200";
      case "Medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            className={`flex items-center gap-1 ${getLevelColor(score.engagement_level)}`}
            variant="outline"
          >
            <Zap className="h-3 w-3 fill-current" />
            {score.engagement_level} ({score.engagement_score})
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="p-4 space-y-2">
          <p className="font-bold border-b pb-1">Engagement Breakdown</p>
          <div className="text-xs space-y-1">
            <div className="flex justify-between gap-4">
              <span>Activity Score:</span>
              <span className="font-medium text-indigo-600">
                {score.score_breakdown?.activity_score}/40
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Payment Score:</span>
              <span className="font-medium text-indigo-600">
                {score.score_breakdown?.payment_score}/30
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span>Subscription Bonus:</span>
              <span className="font-medium text-indigo-600">
                +{score.score_breakdown?.subscription_bonus}
              </span>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
