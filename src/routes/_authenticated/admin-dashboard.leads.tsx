import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  Filter,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin-dashboard/leads")({
  component: AdminLeadsPage,
});

function AdminLeadsPage() {
  const { user, role } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: leads, isLoading, isError } = useQuery({
    queryKey: ["admin-leads", statusFilter],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select("*, initiatives(title)")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "converted":
        return <CheckCircle2 className="h-4 w-4 text-forest" />;
      case "started":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "abandoned":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "inactive":
        return <AlertCircle className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  return (
    
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="font-display text-3xl font-bold text-primary">Lead CRM</h1>
                <p className="mt-1 text-muted-foreground">
                  Manage and track membership acquisition pipeline.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  id="lead-status-filter"
                  aria-label="Filter leads by status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">All Statuses</option>
                  <option value="started">Started</option>
                  <option value="converted">Converted</option>
                  <option value="abandoned">Abandoned</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/40 bg-card">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <Skeleton key={idx} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : isError ? (
                <div className="p-12 text-center text-destructive">
                  Unable to load leads. Please refresh and try again.
                </div>
              ) : leads && leads.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      <tr>
                        <th className="px-6 py-4">Lead</th>
                        <th className="px-6 py-4">Source Initiative</th>
                        <th className="px-6 py-4">Amount</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Created</th>
                        <th className="px-6 py-4">Last Activity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="transition hover:bg-muted/30">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="font-bold text-primary">{lead.full_name}</span>
                              <span className="text-xs text-muted-foreground">{lead.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-medium text-primary/80">
                              {lead.initiatives?.title || "Direct Signup"}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-bold">
                            Rs {Number(lead.amount_mur).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(lead.status)}
                              <span className="capitalize">{lead.status}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {format(new Date(lead.created_at), "MMM d, HH:mm")}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground text-xs">
                            {lead.last_activity_at
                              ? format(new Date(lead.last_activity_at), "MMM d, HH:mm")
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground italic">
                  No leads found for this filter.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    
  );
}
