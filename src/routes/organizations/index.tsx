import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, ArrowRight, Loader } from 'lucide-react';
import { Link } from '@tanstack/react-router';

interface Organization {
  id: string;
  organization_name: string;
  description: string | null;
  logo_url: string | null;
  is_verified: boolean;
  status: string;
}

export function Route() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadVerifiedOrgs() {
      try {
        // Query strictly verified and active organizations
        const { data, error: fetchError } = await supabase
          .from('organizations')
          .select('id, organization_name, description, logo_url, is_verified, status')
          .eq('is_verified', true)
          .eq('status', 'active')
          .order('organization_name', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        setOrganizations(data || []);
      } catch (err) {
        console.error('Error loading organizations:', err);
        setError('Failed to load organizations. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    loadVerifiedOrgs();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-emerald-800 animate-spin" />
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
        <p className="text-gray-600 mt-2 text-lg">
          Browse community organizations and NGOs driving transparent impact on CommonGround.
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {organizations.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-gray-600">No verified organizations found.</p>
        </div>
      )}

      {/* Organizations Grid */}
      {organizations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {organizations.map((org) => (
            <div
              key={org.id}
              className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Header with Logo and Badge */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.organization_name}
                      className="w-12 h-12 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
                      <span className="text-gray-400 text-xs font-bold">
                        {org.organization_name.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                    Verified
                  </span>
                </div>

                {/* Organization Name */}
                <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                  {org.organization_name}
                </h3>

                {/* Description */}
                {org.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                    {org.description}
                  </p>
                )}
              </div>

              {/* View Profile Link */}
              <div className="mt-6 pt-4 border-t flex justify-end">
                <Link
                  to="/entities/$id"
                  params={{ id: org.id }}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-800 hover:text-emerald-900 transition-colors"
                >
                  View Profile
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
