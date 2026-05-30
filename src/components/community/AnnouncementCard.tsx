import { Announcement } from "@/lib/community";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Pin } from "lucide-react";

interface AnnouncementCardProps {
  announcement: Announcement;
}

export function AnnouncementCard({ announcement }: AnnouncementCardProps) {
  return (
    <Card
      className={
        announcement.pinned
          ? "border-amber-500 bg-amber-50/50 shadow-md"
          : "border-border/40 shadow-sm"
      }
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest">
              {announcement.category}
            </Badge>
            {announcement.pinned && <Pin className="h-4 w-4 text-amber-500 fill-amber-500" />}
          </div>
          <CardTitle className="text-xl font-display font-bold text-primary">
            {announcement.title}
          </CardTitle>
          <p className="text-xs text-muted-foreground font-medium">
            {announcement.profiles?.full_name || "Admin"} •{" "}
            {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {announcement.image_url && (
          <img
            src={announcement.image_url}
            alt={announcement.title}
            className="w-full h-48 object-cover rounded-2xl mb-4 shadow-sm"
            loading="lazy"
          />
        )}
        <p className="whitespace-pre-wrap text-sm text-foreground/90 leading-relaxed">
          {announcement.content}
        </p>
      </CardContent>
    </Card>
  );
}
