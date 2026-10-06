import { useEffect, useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle,
  Search,
  Building2,
  ShieldCheck,
  HeartHandshake,
  Loader,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Input } from "@/components/ui/input";

interface Organization {
  id: string;
  organization_name: string;
  description: string | null;
  category: string | null;
  mission: string | null;
  logo_url: string | null;
  is_verified: boolean;
  status: string;
}

export const Route = createFileRoute("/organizations/")({
  head: () => ({
    meta: [
      { title: "Meet Our Partners — CommonGround" },
      {
        name: "description",
        content:
          "Discover vetted partner organizations and NGOs driving transparent community impact on CommonGround.",
      },
    ],
  }),
  component: OrganizationsComponent,
});

function OrganizationsComponent() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    async function loadVerifiedOrgs() {
      try {
        setLoading(true);
        // Query strictly verified and active organizations
        const { data, error: fetchError } = await supabase
          .from("organizations")
          .select(
            "id, organization_name, description, category, mission, logo_url, is_verified, status",
          )
          .eq("is_verified", true)
          .eq("status", "active")
          .order("organization_name", { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setOrganizations(data || []);
      } catch (err) {
        console.error("Error loading organizations:", err);
        setError("Failed to load organizations. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    loadVerifiedOrgs();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    organizations.forEach((org) => {
      if (org.category) set.add(org.category);
    });
    return Array.from(set).sort();
  }, [organizations]);

  const filteredOrganizations = useMemo(() => {
    return organizations.filter((org) => {
      const matchesSearch =
        org.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (org.description && org.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (org.mission && org.mission.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory = selectedCategory === "all" || org.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [organizations, searchQuery, selectedCategory]);

  return (
    <SiteLayout>
      {/* Intro Hero Section */}
      <section className="border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-forest/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-forest">
              <ShieldCheck className="h-4 w-4" /> Vetted Partner Network
            </span>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-primary sm:text-5xl lg:text-6xl">
              Meet Our Partners
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Organizations listed here have been reviewed and verified by CommonGround before being
              presented as partners. Discover non-profits, NGOs, and community organizations
              working toward positive, transparent impact.
            </p>
          </div>

          {/* Search & Filter Bar */}
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-card p-4 rounded-2xl border border-border/60 shadow-xs">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search partner organizations by name or keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl bg-background border-border"
              />
            </div>

            {categories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === "all"
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === cat
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Content / Organizations Directory Grid */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex min-h-[300px] flex-col items-center justify-center gap-4">
              <Loader className="h-8 w-8 animate-spin text-forest" />
              <p className="text-sm font-medium text-muted-foreground">
                Loading verified partner organizations...
              </p>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6 text-center">
              <p className="text-sm font-bold text-red-700">{error}</p>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center bg-card">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground/60 mb-3" />
              <h3 className="font-display text-lg font-bold text-primary">
                No organizations found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {searchQuery || selectedCategory !== "all"
                  ? "Try adjusting your search query or category filters."
                  : "No verified partner organizations are currently listed."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrganizations.map((org) => (
                <div
                  key={org.id}
                  className="flex flex-col justify-between rounded-3xl border border-border/60 bg-card p-6 shadow-xs transition-all hover:shadow-md hover:border-border"
                >
                  <div>
                    {/* Header with Logo and Verified Badge */}
                    <div className="mb-4 flex items-center justify-between">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.organization_name}
                          className="h-14 w-14 rounded-2xl border border-border object-cover"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted/50 text-primary font-display font-bold">
                          {org.organization_name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-forest/10 px-3 py-1 text-xs font-bold text-forest">
                        <CheckCircle className="h-3.5 w-3.5 text-forest" />
                        Verified
                      </span>
                    </div>

                    {/* Category Tag */}
                    {org.category && (
                      <span className="inline-block mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {org.category}
                      </span>
                    )}

                    {/* Organization Name */}
                    <h3 className="font-display text-xl font-bold text-primary line-clamp-1">
                      {org.organization_name}
                    </h3>

                    {/* Description or Mission */}
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                      {org.description ||
                        org.mission ||
                        "Dedicated partner working toward sustainable community impact."}
                    </p>
                  </div>

                  {/* View Profile Action */}
                  <div className="mt-6 border-t border-border/40 pt-4 flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      CommonGround Partner
                    </span>
                    <Link
                      to="/entities/$id"
                      params={{ id: org.id }}
                      className="inline-flex items-center gap-1.5 text-sm font-bold text-forest hover:text-forest/80 transition-colors"
                    >
                      View Profile
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section for Organizations Wanting to Join */}
      <section className="border-t border-border/40 bg-card py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary/95 to-forest p-8 sm:p-12 lg:p-16 text-primary-foreground shadow-xl">
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                <HeartHandshake className="h-4 w-4" /> For Non-Profits & NGOs
              </span>
              <h2 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Are you an organization looking to expand your impact?
              </h2>
              <p className="mt-4 text-base leading-relaxed text-primary-foreground/80 sm:text-lg">
                Join CommonGround to secure predictable, recurring funding for your programs,
                streamline impact reporting, and connect directly with engaged supporters.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/for-orgs"
                  className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-md transition-all hover:bg-white/90 hover:shadow-lg active:scale-95"
                >
                  Learn More & Join Us
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  to="/partner"
                  className="inline-flex items-center justify-center rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
                >
                  Apply Directly
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
