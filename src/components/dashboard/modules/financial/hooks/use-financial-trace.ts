import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FinancialTrace {
  paymentId: string;
  createdAt: string;
  userName: string;
  grossAmount: number;
  feeAmount: number;
  platformAmount: number;
  allocations: {
    initiativeName: string;
    amount: number;
    type: 'allocation' | 'impact_pool';
  }[];
}

export function useFinancialTrace() {
  return useQuery({
    retry: false,
    queryKey: ["dashboard", "financial", "trace"],
    queryFn: async () => {
      const { data: events, error } = await supabase
        .from("financial_events")
        .select(`
          payment_id,
          created_at,
          event_type,
          amount_mur,
          profiles:user_id (full_name),
          initiatives:initiative_id (title)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by payment_id
      const groups: Record<string, FinancialTrace> = {};

      events?.forEach((event) => {
        const pId = event.payment_id;
        if (!pId) return;

        if (!groups[pId]) {
          groups[pId] = {
            paymentId: pId,
            createdAt: event.created_at,
            userName: (event.profiles as any)?.full_name || "Anonymous",
            grossAmount: 0,
            feeAmount: 0,
            platformAmount: 0,
            allocations: [],
          };
        }

        const group = groups[pId];

        if (event.event_type === 'payment_received') {
          group.grossAmount = Number(event.amount_mur);
        } else if (event.event_type === 'transaction_fee') {
          group.feeAmount = Number(event.amount_mur);
        } else if (event.event_type === 'platform_share') {
          group.platformAmount = Number(event.amount_mur);
        } else if (event.event_type === 'initiative_allocation' || event.event_type === 'impact_pool') {
          group.allocations.push({
            initiativeName: (event.initiatives as any)?.title || (event.event_type === 'impact_pool' ? 'Impact Pool' : 'Unknown'),
            amount: Number(event.amount_mur),
            type: event.event_type === 'impact_pool' ? 'impact_pool' : 'allocation',
          });
        }
      });

      return Object.values(groups);
    }
  });
}
