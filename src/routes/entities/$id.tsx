import React, { useEffect, useState } from 'react';
import { createFileRoute, Link, useParams } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { SiteLayout } from '@/components/site/SiteLayout';
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
  Building2,
  MapPin,
  Target,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
  id: string;
  organization_name: string;
  description: string | null;
  category: string | null;
  mission: string | null;
  goals: string | null;
  address: string | null;
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

interface Initiative {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  goal_amount_mur: number;
  current_amount_mur: number;
  active_supporter_count: number;
  status: string;
}

interface FormData {
  organization_name: string;
  description: string;
  category: string;
  mission: string;
  goals: string;
  address: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  is_verified: boolean;
  facebook: string;
  instagram: string;
  linkedin: string;
}

export const Route = createFileRoute('/entities/$id')({
  component: OrganizationProfilePage,
});

function OrganizationProfilePage() {
  const { id } = useParams({ from: '/entities/$id' });
  const { user, role: userRole } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    organization_name: '',
    description: '',
    category: '',
    mission: '',
    goals: '',
    address: '',
    logo_url: '',
    contact_email: '',
    contact_phone: '',
    website_url: '',
    is_verified: false,
    facebook: '',
    instagram: '',
    linkedin: '',
  });

  // Load organization and child initiatives
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();

        if (orgError) throw orgError;

        if (orgData) {
          setOrganization(orgData as Organization);
          setFormData({
            organization_name: orgData.organization_name || '',
            description: orgData.description || '',
            category: orgData.category || '',
            mission: orgData.mission || '',
            goals: orgData.goals || '',
            address: orgData.address || '',
            logo_url: orgData.logo_url || '',
            contact_email: orgData.contact_email || '',
            contact_phone: orgData.contact_phone || '',
            website_url: orgData.website_url || '',
            is_verified: orgData.is_verified || false,
            facebook: orgData.transparency_content?.social_links?.facebook || '',
            instagram: orgData.transparency_content?.social_links?.instagram || '',
            linkedin: orgData.transparency_content?.social_links?.linkedin || '',
          });
        }

        // Fetch initiatives belonging exclusively to this organization
        const { data: initData, error: initError } = await supabase
          .from('initiatives')
          .select('id, title, slug, description, image_url, goal_amount_mur, current_amount_mur, active_supporter_count, status')
          .eq('organization_id', id)
          .eq('status', 'active');

        if (initError) {
          console.error('Error loading child initiatives:', initError);
        } else {
          setInitiatives((initData as Initiative[]) || []);
        }
      } catch (error) {
        console.error('Error loading organization:', error);
        toast.error('Failed to load organization');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  // Determine if user can edit
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
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
        category: formData.category || null,
        mission: formData.mission || null,
        goals: formData.goals || null,
        address: formData.address || null,
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
      <SiteLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex items-center justify-center min-h-[50vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Loading organization profile...</p>
          </div>
        </div>
      </SiteLayout>
    );
  }

  if (!organization) {
    return (
      <SiteLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground/40 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold text-primary">Organization Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            The page you are looking for does not exist or is not publicly accessible.
          </p>
          <div className="mt-6">
            <Link
              to="/entities"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
            >
              Browse Organizations
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="bg-white pb-24">
        {/* Banner / Header Section */}
        <div className="relative bg-muted/40 border-b border-border/40 py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-start sm:items-center gap-6">
                <div className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-white shadow-xl bg-white flex items-center justify-center">
                  {organization.logo_url ? (
                    <img
                      src={organization.logo_url}
                      alt={organization.organization_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary text-white text-3xl font-bold">
                      {organization.organization_name.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-primary">
                      {organization.organization_name}
                    </h1>
                    {organization.is_verified && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-forest/10 text-forest text-xs font-bold rounded-full">
                        <CheckCircle className="w-3.5 h-3.5 text-forest" />
                        Verified Partner
                      </span>
                    )}
                  </div>

                  {organization.category && (
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                      {organization.category}
                    </p>
                  )}

                  {organization.address && (
                    <p className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 text-primary/60 shrink-0" />
                      {organization.address}
                    </p>
                  )}
                </div>
              </div>

              {canEdit && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 text-sm font-bold transition-all shadow-md"
                >
                  <Edit className="w-4 h-4" />
                  Edit Organization Profile
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Body */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Organization Story, Mission, & Child Initiatives */}
            <div className="lg:col-span-2 space-y-12">
              {/* Mission Statement */}
              {organization.mission && (
                <div className="rounded-[2.5rem] bg-forest/5 border border-forest/10 p-8 sm:p-10">
                  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-forest mb-4">
                    <Target className="w-4 h-4" /> Our Mission
                  </h2>
                  <p className="text-lg leading-relaxed text-forest/90 font-medium whitespace-pre-wrap">
                    {organization.mission}
                  </p>
                </div>
              )}

              {/* About / Description */}
              {organization.description && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-primary">About {organization.organization_name}</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base">
                    {organization.description}
                  </p>
                </div>
              )}

              {/* Strategic Goals */}
              {organization.goals && (
                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-primary">Strategic Goals</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap text-base">
                    {organization.goals}
                  </p>
                </div>
              )}

              {/* Child Initiatives Section */}
              <div className="space-y-6 pt-6 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold text-primary">
                      Initiatives & Programs
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Active projects spearheaded by {organization.organization_name}
                    </p>
                  </div>
                  <span className="rounded-full bg-primary/10 text-primary font-bold text-xs px-3 py-1">
                    {initiatives.length} {initiatives.length === 1 ? 'Initiative' : 'Initiatives'}
                  </span>
                </div>

                {initiatives.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/60 p-8 text-center bg-muted/20">
                    <p className="text-muted-foreground text-sm">
                      No active initiatives published yet for this organization.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {initiatives.map((init) => {
                      const progress =
                        init.goal_amount_mur > 0
                          ? (init.current_amount_mur / init.goal_amount_mur) * 100
                          : 0;

                      return (
                        <div
                          key={init.id}
                          className="group flex flex-col justify-between rounded-3xl border border-border/40 bg-card overflow-hidden shadow-sm hover:shadow-md transition-all hover:border-primary/40"
                        >
                          <div>
                            <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                              <img
                                src={
                                  init.image_url ||
                                  'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?auto=format&fit=crop&q=80&w=800'
                                }
                                alt={init.title}
                                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            </div>
                            <div className="p-6 space-y-3">
                              <h3 className="font-display text-xl font-bold text-primary group-hover:text-forest transition-colors line-clamp-1">
                                {init.title}
                              </h3>
                              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {init.description}
                              </p>
                            </div>
                          </div>

                          <div className="p-6 pt-0 space-y-4">
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-xs font-bold">
                                <span className="text-primary">
                                  Rs {Number(init.current_amount_mur || 0).toLocaleString()}
                                </span>
                                <span className="text-forest">{Math.round(progress)}%</span>
                              </div>
                              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-forest transition-all duration-500"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>

                            <Link
                              to="/initiatives/$slug"
                              params={{ slug: init.slug || init.id }}
                              className="inline-flex items-center justify-between w-full rounded-2xl bg-muted/50 px-4 py-2.5 text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all group-hover:bg-primary group-hover:text-white"
                            >
                              <span>View Initiative Details</span>
                              <ArrowRight className="w-4 h-4" />
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Contact & Verification Sidebar */}
            <div className="space-y-8">
              {/* Contact Card */}
              <div className="rounded-[2.5rem] border border-border/40 bg-card p-8 shadow-sm space-y-6">
                <h3 className="font-display text-xl font-bold text-primary">Contact & Links</h3>

                <div className="space-y-4 text-sm">
                  {organization.contact_email && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">Email</p>
                        <a
                          href={`mailto:${organization.contact_email}`}
                          className="font-bold text-primary hover:underline truncate block"
                        >
                          {organization.contact_email}
                        </a>
                      </div>
                    </div>
                  )}

                  {organization.contact_phone && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Phone</p>
                        <a
                          href={`tel:${organization.contact_phone}`}
                          className="font-bold text-primary hover:underline"
                        >
                          {organization.contact_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {organization.website_url && (
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        <Globe className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground font-medium">Website</p>
                        <a
                          href={organization.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-bold text-primary hover:underline truncate block"
                        >
                          {organization.website_url.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Social Links */}
                {(formData.facebook || formData.instagram || formData.linkedin) && (
                  <div className="pt-4 border-t border-border/40">
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">
                      Follow Online
                    </p>
                    <div className="flex gap-3">
                      {formData.facebook && (
                        <a
                          href={formData.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-2xl bg-muted/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                          aria-label="Facebook"
                        >
                          <Facebook className="w-5 h-5" />
                        </a>
                      )}
                      {formData.instagram && (
                        <a
                          href={formData.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-2xl bg-muted/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                          aria-label="Instagram"
                        >
                          <Instagram className="w-5 h-5" />
                        </a>
                      )}
                      {formData.linkedin && (
                        <a
                          href={formData.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="h-10 w-10 rounded-2xl bg-muted/60 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-colors"
                          aria-label="LinkedIn"
                        >
                          <Linkedin className="w-5 h-5" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Vetted Partner Trust Badge */}
              <div className="rounded-[2.5rem] border border-primary/10 bg-primary/5 p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest block">
                      CommonGround Vetted
                    </span>
                    <span className="text-xs text-muted-foreground">Due Diligence Approved</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-primary/80">
                  {organization.organization_name} has passed our verification process, including financial audit and governance review.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <h2 className="text-xl font-bold text-primary">Edit Organization Profile</h2>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-2 hover:bg-muted rounded-full text-muted-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.organization_name}
                    onChange={(e) =>
                      setFormData({ ...formData, organization_name: e.target.value })
                    }
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      placeholder="e.g. Poverty Alleviation"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      placeholder="Port Louis, Mauritius"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                    Mission Statement
                  </label>
                  <textarea
                    value={formData.mission}
                    onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                    Description / About
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                    Strategic Goals
                  </label>
                  <textarea
                    value={formData.goals}
                    onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.website_url}
                      onChange={(e) => setFormData({ ...formData, website_url: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                      Logo URL
                    </label>
                    <input
                      type="url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div className="bg-muted/40 p-4 rounded-xl border border-border flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_verified"
                      checked={formData.is_verified}
                      onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                      className="w-4 h-4 text-primary rounded border-border"
                    />
                    <label htmlFor="is_verified" className="text-sm font-bold text-primary">
                      Verified Partner Organization
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2.5 text-muted-foreground hover:bg-muted rounded-full font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-primary text-white rounded-full hover:bg-primary/90 disabled:opacity-50 font-bold text-sm inline-flex items-center gap-2"
                  >
                    {isSaving && <Loader className="w-4 h-4 animate-spin" />}
                    Save Profile
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
