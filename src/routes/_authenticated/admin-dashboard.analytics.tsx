import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3,
  Activity,
  RefreshCw,
  Clock,
  Search,
  Database,
  CheckCircle2,
  Users,
  TrendingUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin-dashboard/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: initiatives } = useQuery({
    queryKey: ["admin-initiatives-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select(
          "id, title, view_count, conversion_count, active_supporter_count, inactive_supporter_count, organizations(organization_name)",
        )
        .order("conversion_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["admin-recent-events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiative_events")
        .select("*, initiatives(title)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const reconcileMutation = useMutation({
    mutationFn: async (initiativeId: string) => {
      const { error } = await supabase.rpc("reconcile_initiative_analytics", {
        p_initiative_id: initiativeId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Analytics reconciled successfully");
      queryClient.invalidateQueries({ queryKey: ["admin-initiatives-stats"] });
    },
    onError: (err: Error) => {
      toast.error("Reconciliation failed: " + err.message);
    },
  });

  const filteredInitiatives = initiatives?.filter((i) =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Analytics & Auditing
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Initiative Performance
              </h1>
              <p className="mt-2 text-muted-foreground">
                Audit system events and reconcile initiative counters from ground truth.
              </p>
            </div>
            <div className="relative w-full max-w-sm sm:w-64">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search initiatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-border/40 bg-card py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Initiative Stats Table */}
          <div className="mb-16 overflow-hidden rounded-[2rem] border border-border/40 bg-card shadow-sm">
            <div className="p-8 border-b border-border/40 bg-muted/20 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Database className="h-5 w-5 text-indigo-500" />
                Initiative Counters
              </h2>
              <Badge variant="outline">Live System Counters</Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Initiative</TableHead>
                  <TableHead className="text-center">Views</TableHead>
                  <TableHead className="text-center text-forest">Acquired</TableHead>
                  <TableHead className="text-center text-blue-600">Active</TableHead>
                  <TableHead className="text-center text-red-500">Inactive</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInitiatives?.map((i) => (
                  <TableRow key={i.id}>
                    <TableCell>
                      <div className="font-semibold">{i.title}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">
                        {(i.organizations as any)?.organization_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">{i.view_count}</TableCell>
                    <TableCell className="text-center font-mono font-bold">
                      {i.conversion_count}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {i.active_supporter_count}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {i.inactive_supporter_count}
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        onClick={() => reconcileMutation.mutate(i.id)}
                        disabled={reconcileMutation.isPending}
                        className="p-2 rounded-full hover:bg-muted text-indigo-600 transition"
                        title="Reconcile counters from events"
                      >
                        <RefreshCw
                          className={`h-4 w-4 ${reconcileMutation.isPending ? "animate-spin" : ""}`}
                        />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Recent Events Audit Log */}
          <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card shadow-sm">
            <div className="p-8 border-b border-border/40 bg-muted/20 flex items-center justify-between">
              <h2 className="font-display text-xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-amber-500" />
                Audit: Recent Analytics Events
              </h2>
              <Badge variant="secondary">Last 50 Events</Badge>
            </div>
            <div className="p-0">
              {eventsLoading ? (
                <div className="p-8 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <Skeleton key={n} className="h-12 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Event Type</TableHead>
                      <TableHead>Initiative</TableHead>
                      <TableHead>User / Session</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events?.map((e) => (
                      <TableRow key={e.id} className="text-xs">
                        <TableCell className="text-muted-foreground whitespace-nowrap font-mono">
                          {e.created_at ? new Date(e.created_at).toLocaleString() : "-"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`uppercase text-[9px] ${
                              e.event_type === "member_acquired"
                                ? "border-forest text-forest bg-forest/5"
                                : e.event_type === "page_view"
                                  ? "border-blue-500 text-blue-500 bg-blue-50/5"
                                  : "border-amber-500 text-amber-500 bg-amber-50/5"
                            }`}
                          >
                            {e.event_type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {(e.initiatives as any)?.title}
                        </TableCell>
                        <TableCell className="font-mono text-muted-foreground text-[10px]">
                          {e.user_id
                            ? `User: ${e.user_id.substring(0, 8)}...`
                            : `Sess: ${e.session_id?.substring(0, 8)}...`}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
