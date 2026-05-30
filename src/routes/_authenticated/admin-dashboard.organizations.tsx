import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Building2, CheckCircle2, XCircle, ExternalLink, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { updateOrganizationStatus } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/_authenticated/admin-dashboard/organizations")({
  component: AdminOrganizationsPage,
});

function AdminOrganizationsPage() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ["admin-organizations"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await updateOrganizationStatus({ data: { id, status } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
      toast.success("Organization status updated");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const filteredOrgs = organizations.filter((org) =>
    org.organization_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-12 min-h-screen">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-indigo-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Administration
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Organization Registry
              </h1>
              <p className="mt-2 text-muted-foreground">
                Monitor and manage all onboarded organizations.
              </p>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                className="pl-10 rounded-xl"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array(6)
                .fill(0)
                .map((_, i) => (
                  <Card key={i} className="h-48 animate-pulse bg-muted rounded-[2.5rem]" />
                ))}
            </div>
          ) : filteredOrgs.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredOrgs.map((org) => (
                <Card
                  key={org.id}
                  className="rounded-[2.5rem] border-border/40 overflow-hidden group"
                >
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div className="h-16 w-16 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shrink-0">
                        {org.logo_url ? (
                          <img
                            src={org.logo_url}
                            className="h-full w-full object-cover rounded-2xl"
                            alt=""
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-indigo-500" />
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          org.status === "active"
                            ? "bg-green-50 text-green-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {org.status}
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-primary mb-2 line-clamp-1">
                      {org.organization_name}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-6 h-10">
                      {org.description || "No description provided."}
                    </p>

                    <div className="flex items-center justify-between border-t border-border/40 pt-6">
                      <div className="flex gap-2">
                        {org.status !== "active" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-green-600 hover:bg-green-50 h-9 w-9"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: org.id, status: "active" })
                            }
                          >
                            <CheckCircle2 className="h-5 w-5" />
                          </Button>
                        )}
                        {org.status !== "suspended" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full text-red-600 hover:bg-red-50 h-9 w-9"
                            onClick={() =>
                              updateStatusMutation.mutate({ id: org.id, status: "suspended" })
                            }
                          >
                            <XCircle className="h-5 w-5" />
                          </Button>
                        )}
                      </div>
                      {org.website_url && (
                        <a
                          href={org.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1.5"
                        >
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-32 border-2 border-dashed rounded-[3rem]">
              <Info className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-primary">No organizations found</h2>
              <p className="text-muted-foreground mt-2">Try adjusting your search filters.</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
