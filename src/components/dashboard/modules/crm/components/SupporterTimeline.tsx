import { useSupporterTimeline } from "@/hooks/crm/use-supporter-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, CheckCircle2, AlertCircle, Share2, MousePointer2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function SupporterTimeline({ profileId }: { profileId: string }) {
  const { data: timeline, isLoading } = useSupporterTimeline(profileId);

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  const getIcon = (type: string) => {
    switch (type) {
      case 'payment_completed': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'payment_failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'share_click': return <Share2 className="h-4 w-4 text-blue-500" />;
      case 'initiative_view': return <MousePointer2 className="h-4 w-4 text-indigo-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <Card className="rounded-3xl border-border/40">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {timeline?.map((item: any, idx: number) => (
          <div key={item.id} className="relative flex gap-4">
            {idx !== timeline.length - 1 && (
              <div className="absolute left-2 top-8 h-full w-0.5 bg-muted" />
            )}
            <div className="mt-1 bg-background p-0.5 z-10">
              {getIcon(item.event_type)}
            </div>
            <div className="flex-1 pb-4">
              <p className="text-sm font-medium capitalize">
                {item.event_type.replace(/_/g, ' ')}
                {item.initiatives?.title && (
                  <span className="text-muted-foreground font-normal"> on {item.initiatives.title}</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
              </p>
              {item.metadata && Object.keys(item.metadata).length > 0 && (
                <div className="mt-2 p-2 bg-muted/50 rounded-lg text-[10px] text-muted-foreground overflow-hidden">
                  <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        ))}
        {(!timeline || timeline.length === 0) && (
          <p className="text-center py-8 text-sm text-muted-foreground">No activities recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
