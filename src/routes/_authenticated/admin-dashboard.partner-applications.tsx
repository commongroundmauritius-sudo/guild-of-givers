import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield,
  Filter,
  CheckCircle2,
  Clock,
  XCircle,
  Archive,
  MessageSquare,
  Building2,
  Mail,
  ExternalLink,
  History,
  MoreVertical,
  ArrowRight,
} from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  updateApplicationStatus,
  convertApplicationToOrganization,
  softDeleteApplication,
} from "@/lib/partner/actions";
import { PartnerApplicationStatus } from "@/lib/partner/service";

export const Route = createFileRoute("/_authenticated/admin-dashboard/partner-applications")({
  component: AdminPartnerApplicationsPage,
});

function AdminPartnerApplicationsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedApp, setSelectedApp] = useState<any>(null);

  const { data: applications, isLoading, isError, error } = useQuery({
    queryKey: ["admin-partner-applications", statusFilter],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      let query = supabase
        .from("partner_applications")
        .select("*, activity:partner_application_activity(*, actor:profiles(full_name))")
        .order("created_at", { ascending: false })
        .eq("is_deleted", false);

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching partner applications:", error);
        throw error;
      }
      return data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      notes,
    }: {
      id: string;
      status: PartnerApplicationStatus;
      notes?: string;
    }) => {
      if (!user) throw new Error("Unauthorized");
      return await updateApplicationStatus({
        data: { applicationId: id, status, notes },
      });
    },
    onSuccess: () => {
      toast.success("Application status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-partner-applications"] });
      setSelectedApp(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to update status"),
  });

  const convertMutation = useMutation({
    mutationFn: async ({ id, orgData }: { id: string; orgData: any }) => {
      if (!user) throw new Error("Unauthorized");
      return await convertApplicationToOrganization({
        data: { applicationId: id, orgData },
      });
    },
    onSuccess: (org: any) => {
      toast.success(`Converted to organization: ${org.organization_name}`);
      queryClient.invalidateQueries({ queryKey: ["admin-partner-applications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      setSelectedApp(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to convert"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await softDeleteApplication({ data: { applicationId: id } });
    },
    onSuccess: () => {
      toast.success("Application archived");
      queryClient.invalidateQueries({ queryKey: ["admin-partner-applications"] });
      setSelectedApp(null);
    },
    onError: (err: any) => toast.error(err.message || "Failed to archive"),
  });

  const getStatusBadgeCls = (status: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "under_review":
        return "bg-amber-50 text-amber-700 border-amber-100";
      case "approved":
        return "bg-green-50 text-green-700 border-green-100";
      case "rejected":
        return "bg-red-50 text-red-700 border-red-100";
      case "converted":
        return "bg-purple-50 text-purple-700 border-purple-100";
      default:
        return "bg-gray-50 text-gray-700 border-gray-100";
    }
  };

  if (isLoading) {
    return (
      
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Skeleton className="h-12 w-1/4" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      
    );
  }

  return (
    
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <span className="text-sm font-bold uppercase tracking-wider text-primary">
                  Admin Console
                </span>
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-primary">
                Partner Applications
              </h1>
              <p className="mt-2 text-muted-foreground max-w-2xl">
                Review and manage applications from organizations wanting to join the platform.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card px-4 py-2 shadow-sm">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border-none bg-transparent text-sm font-medium focus:ring-0"
                >
                  <option value="all">All Statuses</option>
                  <option value="submitted">Submitted</option>
                  <option value="under_review">Under Review</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="converted">Converted</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* List View */}
            <div className="lg:col-span-2 space-y-4">
              {applications && applications.length > 0 ? (
                applications.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    className={`cursor-pointer overflow-hidden rounded-2xl border transition hover:border-primary/40 hover:shadow-sm ${selectedApp?.id === app.id ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border/40 bg-card"}`}
                  >
                    <div className="p-5 flex items-start justify-between">
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                          <Building2 className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-primary">{app.organization_name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {app.organization_type}
                            </span>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(app.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusBadgeCls(app.status)}`}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center text-muted-foreground italic border border-dashed border-border/60 rounded-2xl">
                  No applications found for this filter.
                </div>
              )}
            </div>

            {/* Detail View */}
            <div className="lg:col-span-1">
              {selectedApp ? (
                <div className="sticky top-8 overflow-hidden rounded-2xl border border-border/40 bg-card shadow-sm">
                  <div className="border-b border-border/40 bg-muted/20 p-6">
                    <h2 className="font-display text-xl font-bold text-primary">
                      Application Detail
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">ID: {selectedApp.id}</p>
                  </div>

                  <div className="p-6 space-y-6">
                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Organization Info
                      </h4>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground">Type:</span>{" "}
                          {selectedApp.organization_type}
                        </p>
                        <p className="text-sm font-medium">
                          <span className="text-muted-foreground">Reg No:</span>{" "}
                          {selectedApp.registration_number}
                        </p>
                        <p className="text-sm font-medium flex items-center gap-1.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <span className="text-muted-foreground">Email:</span> {selectedApp.email}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        Application Message
                      </h4>
                      <p className="mt-3 text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedApp.message}
                      </p>
                    </div>

                    {selectedApp.status !== "converted" && (
                      <div className="grid grid-cols-2 gap-3 pt-4">
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: selectedApp.id, status: "under_review" })
                          }
                          disabled={updateMutation.isPending}
                          className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-muted/30 py-2.5 text-xs font-bold transition hover:bg-muted"
                        >
                          <Clock className="h-3.5 w-3.5" /> Review
                        </button>
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: selectedApp.id, status: "approved" })
                          }
                          disabled={updateMutation.isPending}
                          className="flex items-center justify-center gap-2 rounded-xl bg-green-50 text-green-700 py-2.5 text-xs font-bold transition hover:bg-green-100"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            convertMutation.mutate({ id: selectedApp.id, orgData: {} })
                          }
                          disabled={convertMutation.isPending}
                          className="col-span-2 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
                        >
                          <ArrowRight className="h-4 w-4" /> Convert to Organization
                        </button>
                        <button
                          onClick={() =>
                            updateMutation.mutate({ id: selectedApp.id, status: "rejected" })
                          }
                          disabled={updateMutation.isPending}
                          className="flex items-center justify-center gap-2 rounded-xl bg-red-50 text-red-700 py-2.5 text-xs font-bold transition hover:bg-red-100"
                        >
                          <XCircle className="h-3.5 w-3.5" /> Reject
                        </button>
                        <button
                          onClick={() => deleteMutation.mutate(selectedApp.id)}
                          disabled={deleteMutation.isPending}
                          className="flex items-center justify-center gap-2 rounded-xl border border-border/60 py-2.5 text-xs font-bold transition hover:bg-muted"
                        >
                          <Archive className="h-3.5 w-3.5" /> Archive
                        </button>
                      </div>
                    )}

                    {selectedApp.status === "converted" && (
                      <div className="rounded-xl bg-purple-50 p-4 border border-purple-100">
                        <div className="flex items-center gap-2 text-purple-700 font-bold text-sm">
                          <CheckCircle2 className="h-4 w-4" /> Successfully Converted
                        </div>
                        <p className="text-xs text-purple-600 mt-1">
                          Converted on {format(new Date(selectedApp.converted_at), "MMM d, yyyy")}
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                        <History className="h-3 w-3" /> Recent Activity
                      </h4>
                      <div className="mt-4 space-y-4">
                        {selectedApp.activity && selectedApp.activity.length > 0 ? (
                          selectedApp.activity.slice(0, 3).map((act: any) => (
                            <div
                              key={act.id}
                              className="relative pl-4 before:absolute before:left-0 before:top-2 before:h-2 before:w-2 before:rounded-full before:bg-border"
                            >
                              <p className="text-xs font-medium">
                                {act.metadata?.message || act.action}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {act.actor?.full_name || "System"} •{" "}
                                {format(new Date(act.created_at), "MMM d, HH:mm")}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-muted-foreground italic">
                            No activity logged yet.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-card/50 p-12 text-center">
                  <div className="rounded-full bg-muted p-3">
                    <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-muted-foreground">
                    Select an application to view details and take action.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    
  );
}
