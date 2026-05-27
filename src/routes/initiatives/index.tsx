import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/initiatives/")({
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
                <h3 className="font-display text-2xl font-bold group-hover:text-teal-600">{i.title}</h3>
                <div className="mt-auto pt-8 flex items-center justify-between border-t border-border/40">
                  <span className="font-bold text-primary">Rs {Number(i.current_amount_mur).toLocaleString()}</span>
                  <ArrowRight className="h-5 w-5" />
                </div>
              </Link>
            ))
          }
        </div>
      </div>
    </SiteLayout>
  );
}
