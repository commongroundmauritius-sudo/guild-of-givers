import { getJoinedField } from "@/lib/utils";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  History,
  LayoutDashboard,
  Heart,
  Shield,
  User,
  FileText,
  Users,
  MousePointer2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin-dashboard/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const { user, profile, role, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!loading && role !== "admin" && role !== "super_admin") {
      navigate({ to: "/dashboard" });
    }
  }, [loading, role, navigate]);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !loading && !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const [init, initPending, organizations, members, reports, leads] = await Promise.all([
        supabase.from("initiatives").select("id", { count: "exact", head: true }),
        supabase
          .from("initiatives")
          .select("id", { count: "exact", head: true })
          .eq("is_approved", false),
        supabase
          .from("organizations")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_review"),
        supabase
          .from("user_roles")
          .select("user_id", { count: "exact", head: true })
          .eq("role", "member"),
        supabase
          .from("reports")
          .select("id", { count: "exact", head: true })
          .eq("status", "pending_review"),
        supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "started"),
      ]);
      return {
        initiatives: init.count || 0,
        awaitingReviewOrgs: organizations.count || 0,
        members: members.count || 0,
        pendingReports: reports.count || 0,
        pendingInitiatives: initPending.count || 0,
        activeLeads: leads.count || 0,
      };
    },
  });

  const { data: adminActions, isLoading: actionsLoading } = useQuery({
    queryKey: ["admin-actions"],
    enabled: !loading && !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_actions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data || [];
    },
  });

  const { data: pendingOrgs, isLoading: orgsLoading } = useQuery({
    queryKey: ["pending-orgs"],
    enabled: !loading && !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("status", "pending_review")
        .limit(5);
      return data || [];
    },
  });

  const { data: pendingReports, isLoading: reportsLoading } = useQuery({
    queryKey: ["pending-reports"],
    enabled: !loading && !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase
        .from("reports")
        .select("*, profile:profiles(full_name)")
        .eq("status", "pending_review")
        .limit(5);
      return data || [];
    },
  });

  const { data: pendingInitiatives, isLoading: initiativesLoading } = useQuery({
    queryKey: ["pending-initiatives"],
    enabled: !loading && !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, organization:organizations(organization_name)")
        .eq("is_approved", false)
        .limit(5);
      return data || [];
    },
  });

  const approveOrgMutation = useMutation({
    mutationFn: async (orgId: string) => {
      const { error } = await supabase
        .from("organizations")
        .update({ status: "active", is_verified: true })
        .eq("id", orgId);
      if (error) throw error;
      await supabase.from("admin_actions").insert({
        admin_id: user?.id,
        action_type: "approve_organization",
        target_entity: "organization",
        target_id: orgId,
      });
    },
    onSuccess: () => {
      toast.success("Organization approved");
      queryClient.invalidateQueries({ queryKey: ["pending-orgs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-actions"] });
    },
    onError: () => toast.error("Failed to approve organization"),
  });

  const approveInitiativeMutation = useMutation({
    mutationFn: async (initId: string) => {
      const { error } = await supabase
        .from("initiatives")
        .update({ is_approved: true })
        .eq("id", initId);
      if (error) throw error;
      await supabase.from("admin_actions").insert({
        admin_id: user?.id,
        action_type: "approve_initiative",
        target_entity: "initiative",
        target_id: initId,
      });
    },
    onSuccess: () => {
      toast.success("Initiative approved");
      queryClient.invalidateQueries({ queryKey: ["pending-initiatives"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-actions"] });
    },
    onError: () => toast.error("Failed to approve initiative"),
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-32 w-32 rounded-full" />
      </div>
    );
  }

  return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b pb-6">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-extrabold text-gray-900">
              <Shield className="h-8 w-8 text-emerald-800" />
              Platform Command Center
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Logged in as <span className="font-semibold text-emerald-800">{user?.email}</span> (
              {role})
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => signOut()}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:text-red-600"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <Link
            to="/admin-dashboard/organizations"
            className="group flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 transition-colors group-hover:bg-emerald-800 group-hover:text-white">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-gray-900">Organizations</span>
            <span className="text-[10px] text-gray-500">Manage & Verify</span>
          </Link>

          <Link
            to="/admin-dashboard/leads"
            className="group flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 transition-colors group-hover:bg-emerald-800 group-hover:text-white">
              <MousePointer2 className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-gray-900">Leads & Intent</span>
            <span className="text-[10px] text-gray-500">Convert Supporters</span>
          </Link>

          <Link
            to="/admin-dashboard/partner-applications"
            className="group flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 transition-colors group-hover:bg-emerald-800 group-hover:text-white">
              <FileText className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-gray-900">Partner Applications</span>
            <span className="text-[10px] text-gray-500">NGO Onboarding</span>
          </Link>

          <Link
            to="/admin-dashboard/homepage-layout"
            className="group flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 transition-colors group-hover:bg-emerald-800 group-hover:text-white">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-gray-900">Homepage Layout</span>
            <span className="text-[10px] text-gray-500">CMS & Curation</span>
          </Link>

          <Link
            to="/admin-dashboard/analytics"
            className="group flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 transition-colors group-hover:bg-emerald-800 group-hover:text-white">
              <History className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-gray-900">Analytics</span>
            <span className="text-[10px] text-gray-500">Platform Insights</span>
          </Link>

          <Link
            to="/admin-dashboard/finances"
            className="group flex flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-5 text-center transition-all hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
          >
            <div className="mb-3 rounded-xl bg-emerald-50 p-3 text-emerald-800 transition-colors group-hover:bg-emerald-800 group-hover:text-white">
              <Heart className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-gray-900">Finances</span>
            <span className="text-[10px] text-gray-500">Traceability & Ledger</span>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Pending Orgs
            </span>
            <div className="mt-2 text-3xl font-extrabold text-amber-600">
              {statsLoading ? "..." : stats?.awaitingReviewOrgs}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Pending Initiatives
            </span>
            <div className="mt-2 text-3xl font-extrabold text-amber-600">
              {statsLoading ? "..." : stats?.pendingInitiatives}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active Members
            </span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-800">
              {statsLoading ? "..." : stats?.members}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Total Initiatives
            </span>
            <div className="mt-2 text-3xl font-extrabold text-emerald-800">
              {statsLoading ? "..." : stats?.initiatives}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Active Leads
            </span>
            <div className="mt-2 text-3xl font-extrabold text-blue-600">
              {statsLoading ? "..." : stats?.activeLeads}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Pending Reports
            </span>
            <div className="mt-2 text-3xl font-extrabold text-red-600">
              {statsLoading ? "..." : stats?.pendingReports}
            </div>
          </div>
        </div>

        {/* Action Columns */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Pending Organizations */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Organizations Pending Review ({pendingOrgs?.length || 0})
            </h2>
            {orgsLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : pendingOrgs && pendingOrgs.length > 0 ? (
              <div className="space-y-3">
                {pendingOrgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/50 p-4"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">{org.organization_name}</h4>
                      <p className="text-xs text-gray-500">{org.email}</p>
                    </div>
                    <button
                      onClick={() => approveOrgMutation.mutate(org.id)}
                      disabled={approveOrgMutation.isPending}
                      className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No organizations pending review.</p>
            )}
          </div>

          {/* Pending Initiatives */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Initiatives Pending Review ({pendingInitiatives?.length || 0})
            </h2>
            {initiativesLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : pendingInitiatives && pendingInitiatives.length > 0 ? (
              <div className="space-y-3">
                {pendingInitiatives.map((init) => (
                  <div
                    key={init.id}
                    className="flex items-center justify-between rounded-xl border border-gray-50 bg-gray-50/50 p-4"
                  >
                    <div>
                      <h4 className="font-semibold text-gray-900">{init.title}</h4>
                      <p className="text-xs text-gray-500">
                        {getJoinedField(init.organization, "organization_name")}
                      </p>
                    </div>
                    <button
                      onClick={() => approveInitiativeMutation.mutate(init.id)}
                      disabled={approveInitiativeMutation.isPending}
                      className="rounded-lg bg-emerald-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-900"
                    >
                      Approve
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No initiatives pending review.</p>
            )}
          </div>
        </div>

        {/* Audit Trail */}
        <div className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Recent Admin Actions</h2>
          {actionsLoading ? (
            <p className="text-sm text-gray-500">Loading...</p>
          ) : adminActions && adminActions.length > 0 ? (
            <div className="space-y-3">
              {adminActions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between text-xs text-gray-600 border-b border-gray-50 pb-2"
                >
                  <div>
                    <span className="font-semibold text-gray-900">{action.action_type}</span> on{" "}
                    {action.target_entity} ({action.target_id})
                  </div>
                  <span className="text-gray-400">
                    {new Date(action.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent administrative actions.</p>
          )}
        </div>
      </div>
    );
}
