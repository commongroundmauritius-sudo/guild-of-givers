import { isUUID } from "@/lib/identifiers";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { updateReportStatus } from "@/lib/security/auth-actions";
import { format } from "date-fns";

export const Route = createFileRoute("/entities/$id")({
  component: OrganizationProfilePage,
});

function OrganizationProfilePage() {
  const { id } = Route.useParams();
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const isAdmin = role === "admin" || role === "super_admin";

  const { data: organization, isLoading } = useQuery({
    queryKey: ["organization", id],
    queryFn: async () => {
      if (!isUUID(id)) return null;
      const { data, error } = await supabase
        .from("organizations")
        .select("*, initiatives(*), reports(*)")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const updateReportMutation = useMutation({
    mutationFn: async ({ reportId, status }: { reportId: string; status: any }) => {
      await updateReportStatus({ data: { id: reportId, status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization", id] });
      toast.success("Report status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <SiteLayout>
        <div className="p-24">
          <Skeleton className="h-64 w-full rounded-3xl" />
        </div>
      </SiteLayout>
    );
  }

  if (!organization) {
    return (
      <SiteLayout>
        <div className="p-24 text-center">
          <h2 className="text-2xl font-bold">Organization not found</h2>
          <Link to="/" className="text-primary hover:underline mt-4 block">
            Return home
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const getStatusColor = (status: string) => {
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
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-6">
            <div className="h-24 w-24 rounded-3xl bg-muted flex items-center justify-center border border-border/40 shrink-0">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  className="h-full w-full object-cover rounded-3xl"
                  alt=""
                />
              ) : (
                <FileText className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-4xl font-bold">
                  {organization.organization_name}
                </h1>
                {organization.is_verified && (
                  <span
                    className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold border border-indigo-100 shadow-sm"
                    title="Verified & Vetted Organization"
                  >
                    <ShieldCheck className="h-4 w-4" /> Vetted
                  </span>
                )}
              </div>
              <p className="text-muted-foreground mt-2 max-w-2xl">{organization.description}</p>
            </div>
          </div>

          {organization.website_url && (
            <Button asChild variant="outline" className="rounded-full px-8">
              <a href={organization.website_url} target="_blank" rel="noopener noreferrer">
                Visit Website <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>

        {/* Initiatives Section */}
        <h2 className="font-display text-2xl font-bold mb-8">Active Initiatives</h2>
        <div className="grid gap-8 lg:grid-cols-2">
          {organization.initiatives
            ?.filter((i: any) => i.is_published)
            .map((i: any) => (
              <Link
                key={i.id}
                to="/initiatives/$slug"
                params={{ slug: i.slug || i.id }}
                className="block rounded-[2.5rem] border border-border/40 p-8 hover:border-primary/40 transition group bg-white shadow-sm"
              >
                <h3 className="font-display text-2xl font-bold group-hover:text-primary transition-colors">
                  {i.title}
                </h3>
                <p className="mt-2 text-muted-foreground line-clamp-2">{i.summary}</p>
                <div className="mt-8 flex items-center justify-between border-t border-border/40 pt-6">
                  <span className="font-bold text-lg">
                    Rs {Number(i.current_amount_mur).toLocaleString()} raised
                  </span>
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </div>
              </Link>
            ))}
        </div>

        {/* Admin Reports Section */}
        {isAdmin && (
          <div className="mt-24 pt-20 border-t border-border/40">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="h-6 w-6 text-indigo-600" />
              <h2 className="font-display text-2xl font-bold">Organization Reports (Admin)</h2>
            </div>

            <div className="grid gap-4">
              {organization.reports?.length > 0 ? (
                organization.reports.map((report: any) => (
                  <Card key={report.id} className="rounded-3xl border-border/40">
                    <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                          <FileText className="h-5 w-5 text-indigo-500" />
                        </div>
                        <div>
                          <h4 className="font-bold text-primary">{report.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            Submitted {format(new Date(report.created_at), "MMM d, yyyy")}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}
                        >
                          {report.status.replace(/_/g, " ")}
                        </span>

                        <div className="flex gap-2">
                          {report.status !== "approved" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() =>
                                updateReportMutation.mutate({
                                  reportId: report.id,
                                  status: "approved",
                                })
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
                                updateReportMutation.mutate({
                                  reportId: report.id,
                                  status: "returned_for_revision",
                                })
                              }
                            >
                              <AlertCircle className="h-4 w-4 mr-1" /> Return
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="rounded-full" asChild>
                            <a href={report.file_url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4 mr-1" /> View
                            </a>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-[2rem] border border-dashed border-border/60">
                  <p className="text-muted-foreground">No reports found for this organization.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
