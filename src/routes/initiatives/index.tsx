import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InitiativeCard } from "@/components/InitiativeCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, Loader2, Target } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/initiatives/")({
  component: InitiativesPage,
});

function InitiativesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const { data: initiatives, isLoading, error } = useQuery({
    queryKey: ["public-initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select("*")
        .eq("status", "active")
        .eq("is_approved", true)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const visibleInitiatives = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    const filtered = (initiatives ?? []).filter((initiative) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          initiative.title,
          initiative.summary,
          initiative.description,
          initiative.caption,
          initiative.category,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedSearch));

      const matchesCategory =
        category === "All" ||
        String(initiative.category ?? "").toLowerCase() === category.toLowerCase();

      return matchesSearch && matchesCategory;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === "goal_progress") {
        const progress = (initiative: any) => {
          const goal = Number(initiative.goal_amount_mur) || 0;
          const current = Number(initiative.current_amount_mur) || 0;
          return goal > 0 ? current / goal : 0;
        };

        return progress(b) - progress(a);
      }

      return (
        new Date(b.created_at ?? 0).getTime() -
        new Date(a.created_at ?? 0).getTime()
      );
    });
  }, [initiatives, searchTerm, category, sortBy]);

  const hasFilters = Boolean(searchTerm.trim()) || category !== "All" || sortBy !== "newest";

  return (
    <SiteLayout>
      <section className="bg-cream-deep/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                <Target className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Discovery
              </span>
            </div>
            <h1 className="font-display text-5xl font-bold text-primary sm:text-6xl lg:text-7xl">
              Find Your <br />
              <span className="text-forest">Impact Focus.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground">
              Explore vetted long-term programs. One membership allows you to distribute support
              across multiple initiatives.
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-16 z-30 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search initiatives..."
                className="h-12 rounded-2xl pl-11 focus:ring-primary/20"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 w-[160px] rounded-2xl">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="Environment">Environment</SelectItem>
                  <SelectItem value="Education">Education</SelectItem>
                  <SelectItem value="Health">Health</SelectItem>
                  <SelectItem value="Community">Community</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-12 w-[160px] rounded-2xl">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl">
                  <SelectItem value="newest">Recently Added</SelectItem>
                  <SelectItem value="goal_progress">Goal Progress</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                className="h-12 w-12 rounded-2xl p-0"
                aria-label="Filters"
              >
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex h-64 flex-col items-center justify-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm font-medium text-muted-foreground">Loading initiatives...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center">
              <h3 className="text-xl font-semibold text-primary">Unable to load initiatives</h3>
              <p className="mt-2 text-muted-foreground">
                Please refresh the page and try again.
              </p>
            </div>
          ) : visibleInitiatives.length > 0 ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {visibleInitiatives.map((initiative) => (
                <InitiativeCard key={initiative.id} initiative={initiative} />
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <h3 className="text-xl font-semibold text-primary">No initiatives found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your filters or search term.
              </p>
              <Button
                variant="link"
                className="mt-4 font-bold text-primary"
                onClick={() => {
                  setSearchTerm("");
                  setCategory("All");
                  setSortBy("newest");
                }}
                disabled={!hasFilters}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </SiteLayout>
  );
}
