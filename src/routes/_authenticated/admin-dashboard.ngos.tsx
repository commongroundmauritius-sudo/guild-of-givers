import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Shield, ExternalLink, CheckCircle2, XCircle, Search, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin-dashboard/ngos")({
  component: AdminNGOsPage,
});

function AdminNGOsPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: ngos, isLoading, error } = useQuery({
    queryKey: ["admin-ngos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ngos")
        .select("*")
        .order("name", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("ngos")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("NGO status updated");
      queryClient.invalidateQueries({ queryKey: ["admin-ngos"] });
    },
    onError: (err: Error) => {
      toast.error("Failed to update status: " + err.message);
    },
  });

  const filteredNGOs = ngos?.filter((ngo) =>
    (ngo.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ngo.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Administration
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                NGO Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                Review, verify, and manage NGO partners on the platform.
              </p>
            </div>
            <div className="relative w-full max-w-sm sm:w-64">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search NGOs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-border/40 bg-card py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full rounded-3xl" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-[2.5rem] border border-red-100 bg-red-50/30 p-12 text-center">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <Info className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-red-900">Failed to load NGOs</h2>
              <p className="mt-2 text-red-700/80">There was an error connecting to the database.</p>
              <button
                onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-ngos"] })}
                className="mt-6 rounded-full bg-red-600 px-6 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          ) : filteredNGOs && filteredNGOs.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredNGOs.map((ngo) => (
                <div
                  key={ngo.id}
                  className="overflow-hidden rounded-3xl border border-border/40 bg-card p-6 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                      {ngo.logo_url ? (
                        <img src={ngo.logo_url} alt={ngo.name || "NGO"} className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        <Shield className="h-6 w-6" />
                      )}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        ngo.status === "active"
                          ? "bg-green-100 text-green-700"
                          : ngo.status === "suspended"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {ngo.status || "pending"}
                    </span>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-display text-xl font-bold text-primary">{ngo.name || "Unnamed NGO"}</h3>
                    <p className="mt-1 text-xs font-medium text-amber-600 uppercase tracking-wider">
                      {ngo.category || "General"}
                    </p>
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                      {ngo.description || "No description provided."}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                    <div className="flex gap-2">
                      {ngo.status !== "active" && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: ngo.id, status: "active" })}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-green-600 hover:bg-green-100"
                          title="Approve / Activate"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {ngo.status !== "suspended" && (
                        <button
                          onClick={() => updateStatusMutation.mutate({ id: ngo.id, status: "suspended" })}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                          title="Suspend"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {ngo.website_url && (
                      <a
                        href={ngo.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                      >
                        Website <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border/60 bg-card p-20 text-center">
              <div className="rounded-full bg-muted p-4">
                <Info className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-primary">No NGOs found</h2>
              <p className="mt-2 text-muted-foreground">Try adjusting your search term.</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
