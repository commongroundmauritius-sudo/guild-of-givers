import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Eye, TrendingUp, Heart, Settings, FileText, Upload, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { uploadReport } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/_authenticated/organization")({
  component: OrganizationDashboard,
});

function OrganizationDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [reportTitle, setReportTitle] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("id", user?.id ?? "")
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: initiatives, isLoading: initiativesLoading } = useQuery({
    queryKey: ["org-initiatives", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .eq("organization_id", profile?.organization_id ?? "");
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const { data: reports, isLoading: reportsLoading } = useQuery({
    queryKey: ["org-reports", profile?.organization_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .eq("organization_id", profile?.organization_id ?? "")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!profile?.organization_id,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      await uploadReport({
        data: {
          title: reportTitle,
          description: reportDesc,
          fileUrl: reportUrl,
          organizationId: profile?.organization_id as string,
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-reports"] });
      toast.success("Report uploaded successfully");
      setIsUploadOpen(false);
      setReportTitle("");
      setReportDesc("");
      setReportUrl("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
    onSettled: () => setIsSubmitting(false),
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !reportUrl) {
      toast.error("Please fill in the required fields");
      return;
    }
    setIsSubmitting(true);
    uploadMutation.mutate();
  };

  const totalViews = initiatives?.reduce((sum, i) => sum + (i.view_count || 0), 0) || 0;
  const totalMembers = initiatives?.reduce((sum, i) => sum + (i.conversion_count || 0), 0) || 0;
  const totalActive =
    initiatives?.reduce((sum, i) => sum + (i.active_supporter_count || 0), 0) || 0;
  const conversionRate = totalViews > 0 ? (totalMembers / totalViews) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "returned_for_revision": return <AlertCircle className="h-4 w-4 text-amber-500" />;
      case "reviewing": return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-4xl font-bold text-primary">Organization Dashboard</h1>
            <p className="mt-2 text-muted-foreground">
              Monitor your initiatives and supporter engagement.
            </p>
          </div>
          <div className="flex items-center gap-3">
             <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
               <DialogTrigger asChild>
                 <Button className="rounded-full bg-forest hover:bg-forest/90">
                   <Upload className="mr-2 h-4 w-4" /> Upload Report
                 </Button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-[425px] rounded-[2rem]">
                 <div className="p-4">
                   <h2 className="text-2xl font-bold text-primary mb-6">Submit Impact Report</h2>
                   <form onSubmit={handleUpload} className="space-y-4">
                     <div className="space-y-2">
                       <Label htmlFor="title">Report Title</Label>
                       <Input
                        id="title"
                        placeholder="e.g., May 2024 Impact Report"
                        value={reportTitle}
                        onChange={(e) => setReportTitle(e.target.value)}
                        className="rounded-xl"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="url">Report URL (PDF)</Label>
                       <Input
                        id="url"
                        placeholder="https://..."
                        type="url"
                        value={reportUrl}
                        onChange={(e) => setReportUrl(e.target.value)}
                        className="rounded-xl"
                       />
                       <p className="text-[10px] text-muted-foreground">For now, please provide a link to your hosted PDF.</p>
                     </div>
                     <div className="space-y-2">
                       <Label htmlFor="desc">Notes (Optional)</Label>
                       <Textarea
                        id="desc"
                        placeholder="Brief summary of the report..."
                        value={reportDesc}
                        onChange={(e) => setReportDesc(e.target.value)}
                        className="rounded-xl"
                       />
                     </div>
                     <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-forest mt-4">
                       {isSubmitting ? "Uploading..." : "Submit for Review"}
                     </Button>
                   </form>
                 </div>
               </DialogContent>
             </Dialog>

            <Link
              to="/organization"
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold hover:bg-muted transition"
            >
              <Settings className="h-4 w-4" /> Manage Profile
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <StatCard
            title="Total Views"
            value={totalViews.toLocaleString()}
            icon={<Eye className="h-5 w-5 text-blue-500" />}
          />
          <StatCard
            title="Members Acquired"
            value={totalMembers.toLocaleString()}
            icon={<Users className="h-5 w-5 text-primary" />}
          />
          <StatCard
            title="Active Supporters"
            value={totalActive.toLocaleString()}
            icon={<Heart className="h-5 w-5 text-forest" />}
          />
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate.toFixed(1)}%`}
            icon={<TrendingUp className="h-5 w-5 text-orange-500" />}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <h2 className="font-display text-2xl font-bold text-primary mb-6">Your Initiatives</h2>
            <div className="grid gap-6 md:grid-cols-2">
              {initiativesLoading
                ? [1, 2].map((idx) => <Skeleton key={idx} className="h-48 rounded-[2rem]" />)
                : initiatives?.map((initiative) => (
                    <div
                      key={initiative.id}
                      className="rounded-[2rem] border border-border/40 bg-card p-8 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            initiative.is_published
                              ? "bg-forest/10 text-forest"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {initiative.is_published ? "Published" : "Draft"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(initiative.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-bold text-primary mb-4 line-clamp-1">
                        {initiative.title}
                      </h3>
                      <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Views
                          </span>
                          <p className="font-bold text-primary">{initiative.view_count || 0}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                            Members
                          </span>
                          <p className="font-bold text-primary">{initiative.conversion_count || 0}</p>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-primary">Transparency</h2>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="space-y-4">
              {reportsLoading ? (
                <Skeleton className="h-24 w-full rounded-2xl" />
              ) : reports?.length ? (
                reports.map((report) => (
                  <div key={report.id} className="p-5 rounded-2xl border border-border/40 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-primary line-clamp-1">{report.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wider font-bold">
                          {format(new Date(report.created_at), "MMM d, yyyy")}
                        </p>
                      </div>
                      {getStatusIcon(report.status)}
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">
                         {report.status.replace(/_/g, ' ')}
                       </span>
                       <a
                        href={report.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-bold text-forest hover:underline"
                       >
                         View Report
                       </a>
                    </div>
                    {report.admin_feedback && (
                      <p className="mt-3 text-[10px] bg-amber-50 text-amber-700 p-2 rounded-lg border border-amber-100">
                        Feedback: {report.admin_feedback}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-10 bg-muted/20 rounded-2xl border border-dashed border-border/60">
                   <p className="text-xs text-muted-foreground">No reports uploaded.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted/30">
          {icon}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
      </div>
      <p className="text-3xl font-bold text-primary">{value}</p>
    </div>
  );
}
