import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Info, Heart } from "lucide-react";
import { InitiativeCard } from "@/components/InitiativeCard";

export const Route = createFileRoute("/initiatives/")({
  head: () => ({
    meta: [
      { title: "Initiatives — CommonGround" },
      {
        name: "description",
        content: "Browse long-term, vetted programs you can support with one monthly membership.",
      },
      { property: "og:title", content: "Vetted Initiatives — CommonGround" },
      { property: "og:description", content: "Explore high-impact social programs making a difference in Mauritius." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: InitiativesPage,
});

function InitiativesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: initiatives, isLoading } = useQuery({
    queryKey: ["public-initiatives"],
    queryFn: async () => {
      const { data, error } = await supabase.from("initiatives").select("*").eq("is_published", true).eq("is_approved", true).order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filtered = initiatives?.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <SiteLayout>
      <div className="mx-auto max-w-7xl px-4 py-20">
        <h1 className="font-display text-5xl font-bold text-primary">Vetted Initiatives</h1>
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading ? [1,2,3].map(n => <Skeleton key={n} className="h-64 rounded-3xl" />) :
            filtered?.map((i) => (
              <Link
                key={i.id}
                to="/initiatives/$slug"
                params={{ slug: i.slug || i.id }}
                className="group block rounded-3xl border border-border/40 p-8 hover:shadow-xl transition"
              >
                Retry
              </button>
            </div>
          ) : initiatives && initiatives.length > 0 ? (
            <div className="mt-16 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
              {initiatives.map((i) => (
                <InitiativeCard key={i.id} initiative={i} />
              ))}
            </div>
          ) : (
            <div className="mt-16 rounded-[3rem] border border-dashed border-border/60 bg-muted/30 p-12 text-center sm:p-20">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 text-primary">
                <Heart className="h-10 w-10" />
              </div>
              <h2 className="mt-6 font-display text-2xl font-semibold text-primary">
                No active initiatives found
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-muted-foreground leading-relaxed">
                We're currently vetting new high-impact programs. Join our community to be the first
                to know when they go live.
              </p>
              <div className="mt-10">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-10 py-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl active:scale-95"
                >
                  Become a Member
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}
