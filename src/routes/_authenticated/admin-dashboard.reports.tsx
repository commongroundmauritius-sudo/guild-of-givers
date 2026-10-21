import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, CheckCircle2, XCircle, ExternalLink, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { updateReportStatus } from "@/lib/security/auth-actions";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/admin-dashboard/reports")({
  component: AdminReportsPage,
});

function AdminReportsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();

  const { data: reports = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-reports"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*, organizations(organization_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: any }) => {
      await updateReportStatus({ data: { id, status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reports"] });
      toast.success("Report status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "approved":
        return "bg-green-50 text-green-700 border-green-100";
      case "reviewing":
        return "bg-blue-50 text-blue-700 border-blue-100";
      case "returned_for_revision":
        return "bg-amber-50 text-amber-700 border-amber-100";
      default:
        return "bg-slate-50 text-slate-700 border-slate-100";
    }
  };

  return (
    
      <section className="bg-muted/30 py-12 min-h-screen">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Administration
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Impact Reports
              </h1>
              <p className="mt-2 text-muted-foreground">
                Review and manage transparency reports from all organizations.
              </p>
            </div>
          </div>

          {isError ? (
            <Card className="border-destructive/30">
              <CardContent className="p-8 text-center">
                <p className="font-medium text-destructive">Unable to load impact reports.</p>
                <p className="mt-2 text-sm text-muted-foreground">{error instanceof Error ? error.message : "Please try again."}</p>
              </CardContent>
            </Card>
          ) : isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse bg-muted rounded-3xl" />
              ))}
            </div>
          ) : reports.length > 0 ? (
            <div className="grid gap-6">
              {reports.map((report) => (
                <Card key={report.id} className="rounded-[2rem] border-border/40 overflow-hidden">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
                          <FileText className="h-6 w-6 text-indigo-500" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-primary">{report.title}</h3>
                          <p className="text-sm font-medium text-indigo-600">
                            {report.organizations?.organization_name}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Submitted {format(new Date(report.created_at), "MMM d, yyyy")}
                            </span>
                            {report.report_date && (
                              <span>
                                • Period: {format(new Date(report.report_date), "MMMM yyyy")}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}
                        >
                          {(report.status ?? "pending").replace(/_/g, " ")}
                        </span>

                        <div className="h-8 w-px bg-border/40 hidden md:block mx-2" />

                        <div className="flex gap-2">
                          {report.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() =>
                                updateStatusMutation.mutate({ id: report.id, status: "approved" })
                              }
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" /> Approve
                            </Button>
                          )}
                          {report.status !== "returned_for_revision" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-amber-200 text-amber-700 hover:bg-amber-50"
                              onClick={() =>
                                updateStatusMutation.mutate({
                                  id: report.id,
                                  status: "returned_for_revision",
                                })
                              }
                            >
                              <AlertCircle className="h-4 w-4 mr-1" /> Return
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="rounded-full" asChild>
                            <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" /> View PDF
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                    {report.description && (
                      <p className="mt-4 text-sm text-muted-foreground bg-muted/20 p-4 rounded-2xl italic">
                        "{report.description}"
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 border-2 border-dashed rounded-[3rem]">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-primary">No reports submitted yet</h2>
              <p className="text-muted-foreground mt-2">
                Reports from organizations will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    
  );
}
