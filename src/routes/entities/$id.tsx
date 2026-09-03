import React, { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import {
  Edit,
  X,
  Loader,
  Mail,
  Phone,
  Globe,
  Facebook,
  Linkedin,
  Instagram,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
  id: string;
  organization_name: string;
  description: string | null;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  is_verified: boolean;
  owner_user_id: string | null;
  transparency_content: {
    social_links?: {
      facebook?: string;
      instagram?: string;
      linkedin?: string;
    };
  } | null;
}

interface FormData {
  organization_name: string;
  description: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  is_verified: boolean;
  facebook: string;
  instagram: string;
  linkedin: string;
}

export function Route() {
  const { id } = useParams({ from: '/entities/$id' });
  const { user, userRole } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    organization_name: '',
    description: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    is_verified: false,
    facebook: '',
    instagram: '',
    linkedin: '',
  });

  // Load organization data
  useEffect(() => {
    async function loadOrganization() {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        if (data) {
          setOrganization(data as Organization);
          setFormData({
            organization_name: data.organization_name || '',
            description: data.description || '',
            logo_url: data.logo_url || '',
            contact_email: data.contact_email || '',
            contact_phone: data.contact_phone || '',
            website_url: data.website_url || '',
            is_verified: data.is_verified || false,
            facebook: data.transparency_content?.social_links?.facebook || '',
            instagram: data.transparency_content?.social_links?.instagram || '',
            linkedin: data.transparency_content?.social_links?.linkedin || '',
          });
        }
      } catch (error) {
        console.error('Error loading organization:', error);
        toast.error('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadOrganization();
    }
  }, [id]);

  // Determine if user can edit
  const isAdmin =
    userRole === 'admin' || userRole === 'super_admin';
  const isOwner =
    user?.id && organization?.owner_user_id && user.id === organization.owner_user_id;
  const canEdit = isAdmin || isOwner;

  // Handle form submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization) return;

    try {
      setIsSaving(true);

      const updatePayload: any = {
        organization_name: formData.organization_name,
        description: formData.description || null,
        logo_url: formData.logo_url || null,
        contact_email: formData.contact_email || null,
        contact_phone: formData.contact_phone || null,
        website_url: formData.website_url || null,
        transparency_content: {
          ...(organization.transparency_content || {}),
          social_links: {
            facebook: formData.facebook || null,
            instagram: formData.instagram || null,
            linkedin: formData.linkedin || null,
          },
        },
      };

      // Only include is_verified if user is admin
      if (isAdmin) {
        updatePayload.is_verified = formData.is_verified;
      }

      const { error } = await supabase
        .from('organizations')
        .update(updatePayload)
        .eq('id', organization.id);

      if (error) throw error;

      toast.success('Organization profile updated successfully');
      setIsEditing(false);

      // Refresh organization data
      const { data } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organization.id)
        .single();

      if (data) {
        setOrganization(data as Organization);
      }
    } catch (error) {
      console.error('Error saving organization:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-8 h-8 text-emerald-800 animate-spin" />
          <p className="text-gray-600">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Organization not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-start gap-4">
          {organization.logo_url ? (
            <img
              src={organization.logo_url}
              alt={organization.organization_name}
              className="w-20 h-20 rounded-full object-cover border border-gray-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border border-gray-200">
              <span className="text-gray-400 text-sm font-bold">
                {organization.organization_name.slice(0, 2).toUpperCase()}
              </span>
            </div>
          )}

          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">
                {organization.organization_name}
              </h1>
              {organization.is_verified && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button - Only for Admin or Assigned Owner */}
        {canEdit && (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 text-sm font-medium transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>

      {/* Organization Details */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
        {/* Description */}
        {organization.description && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">About</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {organization.description}
            </p>
          </div>
        )}

        {/* Contact Information */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
          <div className="space-y-3">
            {organization.contact_email && (
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400" />
                <a
                  href={`mailto:${organization.contact_email}`}
                  className="text-emerald-800 hover:text-emerald-900"
                >
                  {organization.contact_email}
                </a>
              </div>
            )}
            {organization.contact_phone && (
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-gray-400" />
                <a
                  href={`tel:${organization.contact_phone}`}
                  className="text-emerald-800 hover:text-emerald-900"
                >
                  {organization.contact_phone}
                </a>
              </div>
            )}
            {organization.website_url && (
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-400" />
                <a
                  href={organization.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-800 hover:text-emerald-900"
                >
                  {organization.website_url}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Social Links */}
        {(formData.facebook || formData.instagram || formData.linkedin) && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Follow Us</h2>
            <div className="flex gap-4">
              {formData.facebook && (
                <a
                  href={formData.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Facebook"
                >
                  <Facebook className="w-6 h-6" />
                </a>
              )}
              {formData.instagram && (
                <a
                  href={formData.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="Instagram"
                >
                  <Instagram className="w-6 h-6" />
                </a>
              )}
              {formData.linkedin && (
                <a
                  href={formData.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-6 h-6" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Edit Organization Profile
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Organization Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name *
                </label>
                <input
                  type="text"
                  value={formData.organization_name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      organization_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) =>
                    setFormData({ ...formData, logo_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              {/* Contact Information Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact_phone: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Website URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website URL (Optional)
                </label>
                <input
                  type="url"
                  value={formData.website_url}
                  onChange={(e) =>
                    setFormData({ ...formData, website_url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="https://..."
                />
              </div>

              {/* Social Links */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Social Links (Optional)
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Facebook
                    </label>
                    <input
                      type="url"
                      value={formData.facebook}
                      onChange={(e) =>
                        setFormData({ ...formData, facebook: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Instagram
                    </label>
                    <input
                      type="url"
                      value={formData.instagram}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          instagram: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={formData.linkedin}
                      onChange={(e) =>
                        setFormData({ ...formData, linkedin: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
                      placeholder="https://linkedin.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Admin Only: Verification Toggle */}
              {isAdmin && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_verified"
                      checked={formData.is_verified}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          is_verified: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
                    />
                    <label
                      htmlFor="is_verified"
                      className="text-sm font-medium text-gray-900"
                    >
                      Verified Organization
                    </label>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 ml-7">
                    Only administrators can change verification status
                  </p>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-emerald-800 text-white rounded-lg hover:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors inline-flex items-center gap-2"
                >
                  {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
