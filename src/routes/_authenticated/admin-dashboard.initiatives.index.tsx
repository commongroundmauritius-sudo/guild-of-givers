import { useRealtimeSync } from "@/hooks/use-realtime-sync";
import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Filter,
  Heart,
  Edit3,
  Info
} from "lucide-react";
import { getJoinedField } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/admin-dashboard/initiatives/")({
  component: InitiativesAdminPage,
});

function InitiativesAdminPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  const queryKeys = useMemo(() => [["admin-initiatives"]], []);
  useRealtimeSync("initiatives", queryKeys);

  const {
    data: initiatives,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*, organizations(id, organization_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredInitiatives = initiatives?.filter((i) => {
    if (i.is_system_owned) return false;

    const matchesSearch =
      (i.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (getJoinedField(i.organizations, "organization_name") || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesSource = sourceFilter === "all" || i.initiative_source === sourceFilter;

    let matchesTab = true;
    if (activeTab === "organization_submitted")
      matchesTab = i.initiative_source === "organization_submission";
    else if (activeTab === "admin_created") matchesTab = i.initiative_source === "admin_created";
    else if (activeTab === "draft") matchesTab = !i.is_published;
    else if (activeTab === "published") matchesTab = i.is_published;
    else if (activeTab === "pending") matchesTab = !i.is_approved;

    return matchesSearch && matchesTab && matchesSource;
  });

  const tabs = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending Review" },
    { id: "organization_submitted", label: "Org Submitted" },
    { id: "admin_created", label: "Admin Created" },
    { id: "published", label: "Published" },
    { id: "draft", label: "Drafts" },
  ];

  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
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
                Review, moderate, and manage all initiatives across the platform.
              </p>
            </div>
            <Link
              to="/admin-dashboard/initiatives/new"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Create Initiative
            </Link>
          </div>

          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition ${
                    activeTab === tab.id
                      ? "bg-amber-600 text-white shadow-sm"
                      : "bg-card text-muted-foreground hover:bg-muted hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 rounded-full border border-border/40 bg-card px-4 py-1.5">
                <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold outline-none"
                >
                  <option value="all">All Sources</option>
                  <option value="organization_submission">Org Submissions</option>
                  <option value="admin_created">Admin Created</option>
                </select>
              </div>

              <div className="relative w-full sm:w-64">
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
          </div>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-64 w-full rounded-[2rem]" />
              ))}
            </div>
          ) : error ? (
            <div className="mt-12 flex flex-col items-center justify-center rounded-[2.5rem] border border-red-100 bg-red-50/30 p-12 text-center">
              <div className="rounded-full bg-red-100 p-3 text-red-600">
                <Info className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold text-red-900">
                Failed to load initiatives
              </h2>
              <p className="mt-2 text-red-700/80">There was an error connecting to the database.</p>
            </div>
          ) : filteredInitiatives && filteredInitiatives.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredInitiatives.map((i) => (
                <div
                  key={i.id}
                  className="group overflow-hidden rounded-[2rem] border border-border/40 bg-card transition hover:shadow-lg"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-muted">
                    {i.image_url ? (
                      <img
                        src={i.image_url}
                        alt={i.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-amber-50/50">
                        <Heart className="h-10 w-10 text-amber-200" />
                      </div>
                    )}
                    <div className="absolute left-4 top-4 flex flex-col gap-2">
                      {!i.is_approved && (
                        <span className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-sm">
                          Pending Review
                        </span>
                      )}
                      {!i.is_published && i.is_approved && (
                        <span className="rounded-full bg-slate-500 px-3 py-1 text-[10px] font-bold uppercase text-white shadow-sm">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">
                        {getJoinedField(i.organizations, "organization_name") || "No Organization"}
                      </span>
                      <span className="text-[9px] font-medium text-muted-foreground uppercase">
                        {i.initiative_source?.replace("_", " ")}
                      </span>
                    </div>
                    <h3 className="font-display text-lg font-bold text-primary transition group-hover:text-amber-600">
                      {i.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {i.description}
                    </p>

                    <div className="mt-6 flex items-center justify-between border-t border-border/40 pt-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          Funding
                        </span>
                        <span className="text-xs font-bold text-primary">
                          Rs {Number(i.current_amount_mur || 0).toLocaleString()}
                        </span>
                      </div>
                      <Link
                        to="/admin-dashboard/initiatives/$id/manage"
                        params={{ id: i.id }}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-50 text-amber-600 transition group-hover:bg-amber-600 group-hover:text-white shadow-sm"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-[3rem] border border-dashed border-border/60 bg-card p-20 text-center">
              <div className="rounded-full bg-muted p-4">
                <Info className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-primary">
                No initiatives found
              </h2>
              <p className="mt-2 text-muted-foreground">Try adjusting your filters or search.</p>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
