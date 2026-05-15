import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Search, Eye, Globe, EyeOff, Edit3, ArrowRight, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/admin-dashboard/initiatives/")({
  component: AdminInitiativesPage,
});

function AdminInitiativesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: initiatives, isLoading } = useQuery({
    queryKey: ["admin-all-initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*, ngos(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredInitiatives = initiatives?.filter((i) =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.ngos as any)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600">
                  Administration
                </span>
              </div>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
                Initiative Management
              </h1>
              <p className="mt-2 text-muted-foreground">
                Oversee all social impact programs, handle approvals, and manage content.
              </p>
            </div>
            <div className="relative w-full max-w-sm sm:w-64">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search initiatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-full border border-border/40 bg-card py-2.5 pl-11 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-3xl" />
              ))}
            </div>
          ) : filteredInitiatives && filteredInitiatives.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredInitiatives.map((i) => (
                <div
                  key={i.id}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-border/40 bg-card transition-all hover:shadow-lg"
                >
                  <div className="relative aspect-video bg-muted">
                    {i.image_url ? (
                      <img
                        src={i.image_url}
                        alt={i.title}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800";
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-amber-50 to-amber-100/50">
                        <Heart className="h-10 w-10 text-amber-200" />
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                       <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase shadow-sm ${
                         i.is_approved ? "bg-green-500 text-white" : "bg-amber-500 text-white"
                       }`}>
                         {i.is_approved ? "Approved" : "Pending Approval"}
                       </span>
                       <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase shadow-sm ${
                         i.is_published ? "bg-blue-500 text-white" : "bg-gray-500 text-white"
                       }`}>
                         {i.is_published ? "Published" : "Hidden"}
                       </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                      {(i.ngos as any)?.name || "Partner NGO"}
                    </p>
                    <h2 className="mt-2 font-display text-xl font-bold text-primary group-hover:text-primary/80">
                      {i.title}
                    </h2>
                    <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                      {i.summary || "No summary provided."}
                    </p>

                    <div className="mt-auto pt-6 flex items-center justify-between border-t border-border/40">
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                             <Globe className={`h-3.5 w-3.5 ${i.is_published ? "text-forest-soft" : "text-gray-300"}`} />
                             {i.is_published ? "Live" : "Draft"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                             <Edit3 className="h-3.5 w-3.5 text-amber-500" />
                             Manage
                          </div>
                       </div>
                       <Link
                         to="/admin-dashboard/initiatives/$id/manage"
                         params={{ id: i.id }}
                         className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500 text-white transition hover:bg-amber-600"
                       >
                         <ArrowRight className="h-4 w-4" />
                       </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[2.5rem] border border-dashed border-border/60 bg-card p-20 text-center">
              <div className="rounded-full bg-muted p-4">
                <Info className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-primary">No initiatives found</h2>
              <p className="mt-2 text-muted-foreground">Adjust your search or wait for new submissions.</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
