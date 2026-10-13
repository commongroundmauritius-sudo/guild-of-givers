import { createFileRoute, redirect } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { engagementService } from "@/lib/engagement-service";
import { Bell, Check, BellOff, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { getSessionUser } from "@/lib/security/auth";

export const Route = createFileRoute("/notifications")({
  beforeLoad: async ({ location }) => {
    const user = await getSessionUser();
    if (!user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.pathname },
        replace: true,
      });
    }
  },
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, isError, error } = useQuery({
    queryKey: ["notifications-full", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user?.id as string)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (ids: string[]) => engagementService.markAsRead(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications-full", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    },
    onError: () => toast.error("Failed to mark notification as read"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Notification deleted");
      queryClient.invalidateQueries({ queryKey: ["notifications-full", user?.id] });
    },
    onError: () => toast.error("Failed to delete notification"),
  });

  const unreadCount = notifications?.filter((n) => !n.read).length || 0;

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Activity Center
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Notifications
              </h1>
            </div>

            {unreadCount > 0 && (
              <Button
                onClick={() =>
                  markReadMutation.mutate(notifications!.filter((n) => !n.read).map((n) => n.id))
                }
                variant="outline"
                className="rounded-xl gap-2"
              >
                <Check className="h-4 w-4" /> Mark all as read
              </Button>
            )}
          </div>

          <div className="space-y-4">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <RefreshCw className="h-8 w-8 animate-spin text-primary/50" />
                <p className="text-muted-foreground font-medium">Loading your activity...</p>
              </div>
            ) : isError ? (
              <div className="py-24 flex flex-col items-center justify-center gap-3 text-center">
                <BellOff className="h-10 w-10 text-destructive/70" />
                <h3 className="text-xl font-semibold text-primary">Unable to load notifications</h3>
                <p className="text-muted-foreground max-w-md">Please try again. {error instanceof Error ? error.message : "Something went wrong while loading your activity."}</p>
              </div>
            ) : notifications && notifications.length > 0 ? (
              notifications.map((n: any) => (
                <Card
                  key={n.id}
                  className={cn(
                    "rounded-3xl border-border/40 transition-all hover:shadow-md",
                    !n.read && "bg-primary/5 border-primary/20",
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div
                          className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0",
                            !n.read
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                          )}
                        >
                          <Bell className="h-6 w-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-lg leading-tight">
                              {n.type.replace("_", " ").charAt(0).toUpperCase() +
                                n.type.slice(1).replace("_", " ")}
                            </h3>
                            {!n.read && <Badge className="bg-primary hover:bg-primary">New</Badge>}
                          </div>
                          <p className="text-muted-foreground">
                            {(n.metadata as any)?.message || "Update on your account activity."}
                          </p>
                          <p className="text-xs text-muted-foreground/60 pt-1">
                            {formatDistanceToNow(new Date(n.created_at))} ago
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {!n.read && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-xl h-9 w-9"
                            onClick={() => markReadMutation.mutate([n.id])}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-xl h-9 w-9 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteMutation.mutate(n.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-center">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-6">
                  <BellOff className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <h3 className="text-xl font-semibold text-primary mb-2">No notifications yet</h3>
                <p className="text-muted-foreground max-w-xs mx-auto">
                  When there's activity on your account or updates from initiatives, you'll see them
                  here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
