import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { RealtimeChannel } from "@supabase/supabase-js";

export function useRealtimeSync(table: string, queryKeys: string[][]) {
  const queryClient = useQueryClient();
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    // If a channel already exists for these dependencies, don't recreate it
    // This guards against the dual-mount issue in React Strict Mode
    if (channelRef.current) {
      return;
    }

    console.log(`Subscribing to realtime-${table}`);

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: table,
        },
        () => {
          queryKeys.forEach((key) => {
            queryClient.invalidateQueries({ queryKey: key });
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`Successfully subscribed to realtime-${table}`);
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`Unsubscribing from realtime-${table}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [table, queryKeys, queryClient]);
}
