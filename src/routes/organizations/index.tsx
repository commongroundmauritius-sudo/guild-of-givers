import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CheckCircle, Loader } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Organization {
  id: string;
  organization_name: string;
  description: string | null;
  logo_url: string | null;
  is_verified: boolean;
  status: string;
}

export const Route = createFileRoute("/organizations/")({
  component: OrganizationsComponent,
});

function OrganizationsComponent() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVerifiedOrgs() {
      try {
        // Query strictly verified and active organizations
        const { data, error: fetchError } = await supabase
          .from("organizations")
          .select("id, organization_name, description, logo_url, is_verified, status")
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex min-h-screen items-center justify-center px-4 py-12">
        <div className="flex flex-col items-center gap-4">
          <Loader className="h-8 w-8 animate-spin text-emerald-800" />
          <p className="text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Verified Organizations</h1>
        <p className="mt-2 text-lg text-gray-600">
          Browse community organizations and NGOs driving transparent impact on CommonGround.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {organizations.length === 0 && !error && (
        <div className="py-12 text-center">
          <p className="text-gray-600">No verified organizations found.</p>
        </div>
      )}

      {/* Organizations Grid */}
      {organizations.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              {/* Header with Logo and Badge */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.organization_name}
                      className="h-12 w-12 rounded-full border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-gray-100">
                      <span className="text-xs font-bold text-gray-400">
                        {org.organization_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                    Verified
                  </span>
                </div>

                {/* Organization Name */}
                <h3 className="line-clamp-2 text-lg font-bold text-gray-900">
                  {org.organization_name}
                </h3>

                {/* Description */}
                {org.description && (
                  <p className="mt-2 line-clamp-3 text-sm text-gray-600">{org.description}</p>
                )}
              </div>

              {/* View Profile Link */}
              <div className="mt-6 flex justify-end border-t pt-4">
                <Link
                  to="/entities/$id"
                  params={{ id: org.id }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 transition-colors hover:text-emerald-900"
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
  );
}
