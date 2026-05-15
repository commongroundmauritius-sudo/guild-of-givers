import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Users, Search, Mail, Phone, Calendar, Info, CheckCircle2, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin-dashboard/leads")({
  component: AdminLeadsPage,
});

function AdminLeadsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: leads, isLoading } = useQuery({
    queryKey: ["admin-leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("leads").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lead status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-leads"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to update lead: " + err.message);
    },
  });

  const filteredLeads = leads?.filter(
    (lead) =>
      (lead.full_name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
      (lead.email?.toLowerCase() || "").includes(searchTerm.toLowerCase()),
  );

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Fintech & CRM
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Membership Leads
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage potential members and contribution interests.
              </p>
            </div>
            <div className="relative w-full max-w-sm sm:w-64">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-border/40 bg-card py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-border/40 bg-card shadow-sm">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            ) : filteredLeads && filteredLeads.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Lead Name
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Contact
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Amount (MUR)
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Joined
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Status
                      </th>
                      <th className="px-8 py-5 font-medium uppercase tracking-wider text-[10px]">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {filteredLeads.map((lead) => (
                      <tr key={lead.id} className="transition hover:bg-muted/30">
                        <td className="px-8 py-5">
                          <div>
                            <p className="font-semibold text-primary">
                              {lead.full_name || "Unnamed Lead"}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase font-mono">
                              {lead.id.substring(0, 8)}
                            </p>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              <span className="text-xs">{lead.email}</span>
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span className="text-xs">{lead.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="font-bold text-teal-600">
                            Rs {Number(lead.amount_mur || 0).toLocaleString()}
                            {lead.covers_fees && (
                              <span className="ml-1 text-[9px] text-muted-foreground underline">
                                + Fee
                              </span>
                            )}
                          </p>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span className="text-xs">
                              {lead.created_at
                                ? new Date(lead.created_at).toLocaleDateString()
                                : "N/A"}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              lead.status === "converted"
                                ? "bg-green-100 text-green-700"
                                : lead.status === "archived"
                                  ? "bg-gray-100 text-gray-700"
                                  : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {lead.status || "pending"}
                          </span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex gap-2">
                            {lead.status !== "converted" && (
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: lead.id, status: "converted" })
                                }
                                className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </button>
                            )}
                            {lead.status !== "archived" && (
                              <button
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: lead.id, status: "archived" })
                                }
                                className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-20 text-center">
                <div className="rounded-full bg-muted p-4">
                  <Info className="h-8 w-8 text-muted-foreground" />
                </div>
                <h2 className="mt-6 font-display text-2xl font-semibold text-primary">
                  No leads found
                </h2>
                <p className="mt-2 text-muted-foreground">
                  No membership leads match your current criteria.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
