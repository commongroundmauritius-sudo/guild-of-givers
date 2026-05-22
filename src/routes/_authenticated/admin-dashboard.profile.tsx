import { getJoinedField } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { History, Heart, CheckCircle2, User, Mail, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/admin-dashboard/profile")({
  component: AdminProfile,
});

function AdminProfile() {
  const { user, profile } = useAuth();

  const { data: adminActions } = useQuery({
    queryKey: ["admin-actions-history", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("admin_actions")
        .select("*")
        .eq("admin_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(10);
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: managedInitiatives } = useQuery({
    queryKey: ["managed-initiatives"],
    queryFn: async () => {
      const { data } = await supabase
        .from("initiatives")
        .select("*, organizations(organization_name)")
        .limit(5);
      return data;
    },
    enabled: !!user?.id,
  });

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Admin";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-amber-500/20 bg-card shadow-xl">
            <div className="h-32 bg-amber-500/10" />
            <div className="relative px-8 pb-8">
              <div className="absolute -top-16 left-8">
                <Avatar className="h-32 w-32 border-4 border-card shadow-lg">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-amber-100 text-3xl font-bold text-amber-700">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="pt-20">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h1 className="font-display text-3xl font-bold text-primary">
                        {displayName}
                      </h1>
                      <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">
                        Admin Role
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        {user?.email}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        Joined{" "}
                        {user?.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "Recently"}
                      </div>
                    </div>
                  </div>
                </div>

                {profile?.bio && (
                  <div className="mt-8">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      About
                    </h2>
                    <p className="mt-2 max-w-2xl text-foreground/80 leading-relaxed">
                      {profile.bio}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <History className="h-5 w-5 text-amber-500" />
                  <h2 className="font-display text-2xl font-semibold text-primary">
                    Recent Actions
                  </h2>
                </div>
                <div className="overflow-hidden rounded-3xl border border-border/40 bg-card">
                  {adminActions && adminActions.length > 0 ? (
                    <div className="divide-y divide-border/40">
                      {adminActions.map((action) => (
                        <div key={action.id} className="p-6 transition hover:bg-muted/50">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-primary capitalize">
                                {action.action_type.replace(/_/g, " ")}
                              </p>
                              <p className="mt-1 text-xs text-muted-foreground uppercase font-mono">
                                {new Date(action.created_at).toLocaleString()}
                              </p>
                            </div>
                            <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600 uppercase">
                              {action.target_type}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 text-center text-muted-foreground italic">
                      No recent activity logged.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Heart className="h-5 w-5 text-amber-500" />
                  <h2 className="font-display text-2xl font-semibold text-primary">
                    Managed Initiatives
                  </h2>
                </div>
                <div className="space-y-4">
                  {managedInitiatives?.map((i) => (
                    <div
                      key={i.id}
                      className="rounded-2xl border border-border/40 bg-card p-4 transition hover:shadow-md"
                    >
                      <p className="text-xs font-bold text-amber-600 uppercase">
                        {getJoinedField(i.organizations, "organization_name")}
                      </p>
                      <h3 className="mt-1 font-semibold text-primary">{i.title}</h3>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-forest-soft" />
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">
                          {i.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
