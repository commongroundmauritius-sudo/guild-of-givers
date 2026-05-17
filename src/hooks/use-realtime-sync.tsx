import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtimeSync(table: string, queryKeys: string[][]) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // Generate a unique channel name for this specific hook instance to prevent
    // collisions and the "after subscribe" error when multiple components
    // listen to the same table.
    const instanceId = Math.random().toString(36).substring(2, 9);
    const channelName = `realtime-${table}-${instanceId}`;

    console.log(`[useRealtimeSync] Subscribing to ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        () => {
          console.log(`[useRealtimeSync] Change detected in ${table}, invalidating queries...`);
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[useRealtimeSync] Successfully subscribed to ${channelName}`);
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        console.log(`[useRealtimeSync] Removing channel ${channelName}`);
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, queryKeys, queryClient]);
}
