import React, { useEffect, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
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
  Award,
  FileText,
  DollarSign,
  Layers,
  Activity,
} from "lucide-react";
import { toast } from "sonner";
import { sanitize } from "@/lib/security/sanitizeHtml";
import {
  TeamMemberGrid,
  TeamMemberEditor,
  TeamMember,
} from "@/components/organization/TeamManager";

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
  status: string | null;
  owner_user_id: string | null;
  impact_metrics: string | null;
  milestones: string | null;
  expected_outcomes: string | null;
  transparency_content: any;
  allocation_summary: string | null;
  monthly_target_amount: number | null;
  current_collected_amount: number | null;
  supporters_count: number | null;
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
  status: string;
  mission: string;
  goals: string;
  address: string;
  logo_url: string;
  contact_email: string;
  contact_phone: string;
  website_url: string;
  is_verified: boolean;
  monthly_target_amount: string;
  impact_metrics: string;
  milestones: string;
  expected_outcomes: string;
  allocation_summary: string;
  facebook: string;
  instagram: string;
  linkedin: string;
}

export const Route = createFileRoute("/entities/$id")({
  component: OrganizationProfilePage,
});

function OrganizationProfilePage() {
  const { id } = useParams({ from: "/entities/$id" });
  const { user, role: userRole } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [initiatives, setInitiatives] = useState<Initiative[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    organization_name: "",
    description: "",
    category: "",
    status: "active",
    mission: "",
    goals: "",
    address: "",
    logo_url: "",
    contact_email: "",
    contact_phone: "",
    website_url: "",
    is_verified: false,
    monthly_target_amount: "0",
    impact_metrics: "",
    milestones: "",
    expected_outcomes: "",
    allocation_summary: "",
    facebook: "",
    instagram: "",
    linkedin: "",
  });

  // Load organization and child initiatives
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", id)
          .single();

        if (orgError) throw orgError;

        if (orgData) {
          setOrganization(orgData as Organization);

          // Fetch team members
          const { data: teamData, error: teamError } = await supabase
            .from("organization_team_members")
            .select("*")
            .eq("organization_id", id)
            .order("display_order", { ascending: true })
            .order("created_at", { ascending: true });

          if (!teamError) {
            setTeamMembers((teamData as TeamMember[]) || []);
          }
          setFormData({
            organization_name: orgData.organization_name || "",
            description: orgData.description || "",
            category: orgData.category || "",
            status: orgData.status || "active",
            mission: orgData.mission || "",
            goals: orgData.goals || "",
            address: orgData.address || "",
            logo_url: orgData.logo_url || "",
            contact_email: orgData.contact_email || "",
            contact_phone: orgData.contact_phone || "",
            website_url: orgData.website_url || "",
            is_verified: orgData.is_verified || false,
            monthly_target_amount: orgData.monthly_target_amount
              ? String(orgData.monthly_target_amount)
              : "0",
            impact_metrics: orgData.impact_metrics || "",
            milestones: orgData.milestones || "",
            expected_outcomes: orgData.expected_outcomes || "",
            allocation_summary: orgData.allocation_summary || "",
            facebook: orgData.transparency_content?.social_links?.facebook || "",
            instagram: orgData.transparency_content?.social_links?.instagram || "",
            linkedin: orgData.transparency_content?.social_links?.linkedin || "",
          });
        }

        // Fetch initiatives belonging exclusively to this organization
        const { data: initData, error: initError } = await supabase
          .from("initiatives")
          .select(
            "id, title, slug, description, image_url, goal_amount_mur, current_amount_mur, active_supporter_count, status",
          )
          .eq("organization_id", id)
          .eq("status", "active")
          .eq("is_approved", true)
          .eq("is_published", true);

        if (initError) {
          console.error("Error loading child initiatives:", initError);
        } else {
          setInitiatives((initData as Initiative[]) || []);
        }
      } catch (error) {
        console.error("Error loading organization:", error);
        toast.error("Failed to load organization");
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  // Determine if user can edit
  const isAdmin = userRole === "admin" || userRole === "super_admin";
  const isOwner = user?.id && organization?.owner_user_id && user.id === organization.owner_user_id;
  const canEdit = Boolean(isAdmin || isOwner);

  // Handle form submission
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!organization) return;

    try {
      setIsSaving(true);

      const updatePayload: any = {
        organization_name: sanitize(formData.organization_name),
        description: formData.description ? sanitize(formData.description) : null,
        category: formData.category ? sanitize(formData.category) : null,
        mission: formData.mission ? sanitize(formData.mission) : null,
        goals: formData.goals ? sanitize(formData.goals) : null,
        address: formData.address ? sanitize(formData.address) : null,
        logo_url: formData.logo_url ? sanitize(formData.logo_url) : null,
        contact_email: formData.contact_email ? sanitize(formData.contact_email) : null,
        contact_phone: formData.contact_phone ? sanitize(formData.contact_phone) : null,
        website_url: formData.website_url ? sanitize(formData.website_url) : null,
        impact_metrics: formData.impact_metrics ? sanitize(formData.impact_metrics) : null,
        milestones: formData.milestones ? sanitize(formData.milestones) : null,
        expected_outcomes: formData.expected_outcomes ? sanitize(formData.expected_outcomes) : null,
        allocation_summary: formData.allocation_summary
          ? sanitize(formData.allocation_summary)
          : null,
        monthly_target_amount: parseFloat(formData.monthly_target_amount) || 0,
        transparency_content: {
          ...(typeof organization.transparency_content === "object" &&
          organization.transparency_content !== null
            ? organization.transparency_content
            : {}),
          social_links: {
            facebook: formData.facebook ? sanitize(formData.facebook) : null,
            instagram: formData.instagram ? sanitize(formData.instagram) : null,
            linkedin: formData.linkedin ? sanitize(formData.linkedin) : null,
          },
        },
      };

      if (isAdmin) {
        updatePayload.is_verified = formData.is_verified;
        updatePayload.status = formData.status;
      }

      const { error } = await supabase
        .from("organizations")
        .update(updatePayload)
        .eq("id", organization.id);

      if (error) throw error;

      toast.success("Organization profile updated successfully");
      setIsEditing(false);

      // Refresh organization data
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organization.id)
        .single();

      if (data) {
        setOrganization(data as Organization);
      }
    } catch (error: any) {
      console.error("Error updating organization:", error);
      toast.error(error.message || "Failed to update organization profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      </SiteLayout>
    );
  }

  if (!organization) {
    return (
      <SiteLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary mb-2">Organization Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The entity profile you are looking for does not exist or has been removed.
          </p>
          <Link
            to="/organizations"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-full hover:bg-primary/90 font-bold"
          >
            Back to Registry
          </Link>
        </div>
      </SiteLayout>
    );
  }

  const socialLinks = organization.transparency_content?.social_links || {};

  return (
    <SiteLayout>
      <div className="min-h-screen bg-muted/20 pb-20">
        {/* Header Hero Banner */}
        <div className="bg-primary text-white pt-12 pb-20 px-4 relative overflow-hidden">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 p-2 flex items-center justify-center shrink-0">
                {organization.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt={organization.organization_name}
                    className="w-full h-full object-cover rounded-2xl"
                  />
                ) : (
                  <Building2 className="w-12 h-12 text-white/80" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <span className="px-3 py-1 bg-white/10 rounded-full text-xs font-bold uppercase tracking-wider text-white/90">
                    {organization.category || "Non-Profit Partner"}
                  </span>
                  {organization.is_verified && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-bold uppercase tracking-wider">
                      <ShieldCheck className="w-4 h-4" /> Verified Partner
                    </span>
                  )}
                  {isAdmin && (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        organization.status === "active"
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      Status: {organization.status || "active"}
                    </span>
                  )}
                </div>
                <h1 className="text-3xl md:text-5xl font-bold font-display">
                  {organization.organization_name}
                </h1>
                {organization.address && (
                  <p className="flex items-center gap-2 text-white/80 text-sm mt-2">
                    <MapPin className="w-4 h-4" /> {organization.address}
                  </p>
                )}
              </div>
            </div>

            {canEdit && (
              <button
                type="button"
                aria-label={isAdmin ? "Edit organization profile as administrator" : "Edit organization profile"}
                onClick={() => setIsEditing(true)}
                className="px-6 py-3 bg-white text-primary rounded-full hover:bg-white/90 font-bold flex items-center gap-2 transition-all shadow-lg shrink-0"
              >
                <Edit className="w-4 h-4" /> {isAdmin ? "Admin Edit Profile" : "Edit Profile"}
              </button>
            )}
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="max-w-7xl mx-auto px-4 -mt-10 relative z-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle Column (Primary Details) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Mission & About */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm space-y-6">
                {organization.mission && (
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Mission Statement
                    </h2>
                    <p className="text-lg font-medium text-foreground/90 italic leading-relaxed">
                      "{organization.mission}"
                    </p>
                  </div>
                )}

                <div>
                  <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-3">
                    About the Organization
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                    {organization.description || "No description provided."}
                  </p>
                </div>

                {organization.goals && (
                  <div className="pt-4 border-t border-border/40">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4" /> Strategic Goals
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {organization.goals}
                    </p>
                  </div>
                )}
              </div>

              {/* Impact Metrics & Outcomes */}
              {(organization.impact_metrics ||
                organization.milestones ||
                organization.expected_outcomes ||
                organization.allocation_summary) && (
                <div className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm space-y-6">
                  <h2 className="text-lg font-bold text-primary flex items-center gap-2">
                    <Activity className="w-5 h-5 text-indigo-500" /> Organizational Impact &
                    Operations
                  </h2>

                  {organization.impact_metrics && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
                        Impact Metrics
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {organization.impact_metrics}
                      </p>
                    </div>
                  )}

                  {organization.milestones && (
                    <div className="pt-4 border-t border-border/40">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
                        Key Milestones
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {organization.milestones}
                      </p>
                    </div>
                  )}

                  {organization.expected_outcomes && (
                    <div className="pt-4 border-t border-border/40">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
                        Expected Outcomes
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {organization.expected_outcomes}
                      </p>
                    </div>
                  )}

                  {organization.allocation_summary && (
                    <div className="pt-4 border-t border-border/40">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-600 mb-1">
                        Fund Allocation Summary
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {organization.allocation_summary}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Meet the Team Leadership Section */}
              <TeamMemberGrid
                members={teamMembers}
                organizationId={organization.id}
                canEdit={canEdit}
                onMembersUpdated={setTeamMembers}
              />

              {/* Active Child Initiatives */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold font-display text-primary">
                    Active Initiatives ({initiatives.length})
                  </h2>
                </div>

                {initiatives.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {initiatives.map((init) => (
                      <Link
                        key={init.id}
                        to="/initiatives/$slug"
                        params={{ slug: init.slug }}
                        className="bg-white rounded-3xl p-6 border border-border/50 hover:border-primary/40 transition-all group block shadow-sm"
                      >
                        <div className="h-40 rounded-2xl bg-muted overflow-hidden mb-4 relative">
                          {init.image_url ? (
                            <img
                              src={init.image_url}
                              alt={init.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <Building2 className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-primary text-lg mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {init.title}
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-4 h-8">
                          {init.description}
                        </p>

                        <div className="flex items-center justify-between text-xs font-bold text-primary pt-2 border-t border-border/40">
                          <span>MUR {(init.current_amount_mur || 0).toLocaleString()} raised</span>
                          <span className="flex items-center gap-1 text-indigo-600">
                            View <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-8 text-center border border-border/50">
                    <p className="text-muted-foreground text-sm">
                      No active public initiatives registered under this organization at this time.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Contact & Verification Badge) */}
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-white rounded-[2.5rem] p-8 border border-border/50 shadow-sm space-y-6">
                <h2 className="text-xs font-bold uppercase tracking-widest text-primary">
                  Contact & Online Presence
                </h2>

                <div className="space-y-4 text-sm">
                  {organization.contact_email && (
                    <a
                      href={`mailto:${organization.contact_email}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <span className="truncate">{organization.contact_email}</span>
                    </a>
                  )}

                  {organization.contact_phone && (
                    <a
                      href={`tel:${organization.contact_phone}`}
                      className="flex items-center gap-3 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Phone className="w-4 h-4 text-primary" />
                      </div>
                      <span>{organization.contact_phone}</span>
                    </a>
                  )}

                  {organization.website_url && (
                    <a
                      href={organization.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-indigo-600 font-bold hover:underline"
                    >
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <Globe className="w-4 h-4 text-indigo-600" />
                      </div>
                      <span className="truncate">Official Website</span>
                    </a>
                  )}
                </div>

                {/* Social Links */}
                {(socialLinks.facebook || socialLinks.instagram || socialLinks.linkedin) && (
                  <div className="pt-4 border-t border-border/40">
                    <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground block mb-3">
                      Social Channels
                    </span>
                    <div className="flex gap-2">
                      {socialLinks.facebook && (
                        <a
                          href={socialLinks.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-all"
                        >
                          <Facebook className="w-5 h-5" aria-hidden="true" />
                        </a>
                      )}
                      {socialLinks.instagram && (
                        <a
                          href={socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-all"
                        >
                          <Instagram className="w-5 h-5" aria-hidden="true" />
                        </a>
                      )}
                      {socialLinks.linkedin && (
                        <a
                          href={socialLinks.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-muted/80 transition-all"
                        >
                          <Linkedin className="w-5 h-5" aria-hidden="true" />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Verified Partner Trust Badge */}
              <div className="rounded-[2.5rem] border border-primary/10 bg-primary/5 p-8 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-primary uppercase tracking-widest block">
                      CommonGround Verified
                    </span>
                    <span className="text-xs text-muted-foreground">Partner Verification</span>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-primary/80">
                  {organization.organization_name} has passed our partner verification process and is currently listed as a verified partner.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Edit Profile Modal */}
        {isEditing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto space-y-6">
              <div className="flex items-center justify-between pb-4 border-b">
                <h2 className="text-xl font-bold text-primary">
                  {isAdmin ? "Admin Organization Editor" : "Edit Organization Profile"}
                </h2>
                <button
                  type="button"
                  aria-label="Close organization profile editor"
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

                {/* Extended DB Fields for Full Field Management */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-bold text-indigo-600 uppercase tracking-wider">
                    Impact & Governance Metrics
                  </h3>

                  <div>
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                      Impact Metrics
                    </label>
                    <textarea
                      value={formData.impact_metrics}
                      onChange={(e) => setFormData({ ...formData, impact_metrics: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      placeholder="e.g. 5,000 meals distributed monthly"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        Key Milestones
                      </label>
                      <textarea
                        value={formData.milestones}
                        onChange={(e) => setFormData({ ...formData, milestones: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        Expected Outcomes
                      </label>
                      <textarea
                        value={formData.expected_outcomes}
                        onChange={(e) =>
                          setFormData({ ...formData, expected_outcomes: e.target.value })
                        }
                        rows={2}
                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        Fund Allocation Summary
                      </label>
                      <textarea
                        value={formData.allocation_summary}
                        onChange={(e) =>
                          setFormData({ ...formData, allocation_summary: e.target.value })
                        }
                        rows={2}
                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1">
                        Monthly Target Amount (MUR)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.monthly_target_amount}
                        onChange={(e) =>
                          setFormData({ ...formData, monthly_target_amount: e.target.value })
                        }
                        className="w-full px-4 py-2.5 border border-border rounded-xl focus:ring-2 focus:ring-primary text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
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
                  <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block">
                      Admin Governance & Status Controls
                    </span>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id="is_verified"
                          checked={formData.is_verified}
                          onChange={(e) =>
                            setFormData({ ...formData, is_verified: e.target.checked })
                          }
                          className="w-4 h-4 text-primary rounded border-border"
                        />
                        <label htmlFor="is_verified" className="text-sm font-bold text-primary">
                          Verified / Vetted Partner
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <label className="text-xs font-bold text-primary uppercase tracking-widest">
                          Status:
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="px-3 py-1.5 border border-border rounded-lg text-sm bg-white font-bold"
                        >
                          <option value="active">Active</option>
                          <option value="pending">Pending</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </div>
                    </div>
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
                    Save Profile Changes
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
