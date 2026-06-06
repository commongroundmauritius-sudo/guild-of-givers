import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { engagementService } from "@/lib/engagement-service";
import { Bell, Check, BellOff, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Database } from "@/integrations/supabase/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];

export function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id as string)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as Notification[];
    },
    // Polling for new notifications
    refetchInterval: 30000,
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      if (!notifications) return;
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
      if (unreadIds.length > 0) {
        await engagementService.markAsRead(unreadIds);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
  });

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-xl hover:bg-muted"
              aria-label="Notifications"
            >
              <Bell className={cn("h-5 w-5", unreadCount > 0 && "text-primary fill-primary/10")} />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full border-2 border-background animate-in zoom-in duration-300">
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>Notifications</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-xl border-border/40">
        <div className="flex items-center justify-between px-3 py-2">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs text-primary hover:text-primary/80"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {markAllReadMutation.isPending ? (
                <RefreshCw className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 mr-1" />
              )}
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator className="my-1" />
        <div className="max-h-96 overflow-y-auto no-scrollbar">
          {isLoading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Syncing...</span>
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-1">
              {notifications.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className={cn(
                    "flex flex-col items-start gap-1 p-3 rounded-xl cursor-default focus:bg-muted",
                    !n.read && "bg-primary/5 border-l-2 border-primary rounded-l-none",
                  )}
                >
                  <div className="flex w-full items-start justify-between gap-2">
                    <span className="font-medium text-sm leading-tight">
                      {n.type === "welcome"
                        ? "🎉 Welcome!"
                        : n.type === "payment_success"
                          ? "💰 Payment Received"
                          : n.type === "subscription_created"
                            ? "✅ Subscription Active"
                            : n.type.replace("_", " ").charAt(0).toUpperCase() +
                              n.type.slice(1).replace("_", " ")}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(new Date(n.created_at))} ago
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {n.metadata && typeof n.metadata === "object" && "message" in n.metadata
                      ? (n.metadata as { message: string }).message
                      : "Update on your account activity."}
                  </p>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-50">
              <BellOff className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs font-medium">All caught up</span>
            </div>
          )}
        </div>
        <DropdownMenuSeparator className="my-1" />
        <Link
          to="/notifications"
          className="w-full flex items-center justify-center py-2 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          onClick={() => setIsOpen(false)}
        >
          View all history
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
