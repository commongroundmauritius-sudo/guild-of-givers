import { getJoinedField } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, User, Mail, MapPin, Phone, CreditCard, ExternalLink, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/member/profile")({
  component: MemberProfile,
});

function MemberProfile() {
  const { user, profile, isSubscribed } = useAuth();

  const { data: subscription } = useQuery({
    queryKey: ["member-subscription-detail", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false })
        .limit(1);
      return data?.[0];
    },
    enabled: !!user?.id,
  });

  const { data: preferences } = useQuery({
    queryKey: ["member-supported-initiatives", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("member_preferences")
        .select("*, initiatives(*, ngos(name))")
        .eq("user_id", user?.id);
      return data;
    },
    enabled: !!user?.id,
  });

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Member";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-teal-600/20 bg-card shadow-xl">
            <div className="h-32 bg-teal-600/10" />
            <div className="relative px-8 pb-8">
              <div className="absolute -top-16 left-8">
                <Avatar className="h-32 w-32 border-4 border-card shadow-lg">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-teal-100 text-3xl font-bold text-teal-700">
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
                      {isSubscribed ? (
                        <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold uppercase text-teal-700">
                          Active Member
                        </span>
                      ) : (
                        <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase text-muted-foreground">
                          Guest User
                        </span>
                      )}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        {user?.email}
                      </div>
                      {profile?.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-4 w-4" />
                          {profile.phone}
                        </div>
                      )}
                      {profile?.age && (
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {profile.age} years old
                        </div>
                      )}
                      {profile?.address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {profile.address}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Heart className="h-5 w-5 text-teal-600" />
                  <h2 className="font-display text-2xl font-semibold text-primary">
                    Supported Initiatives
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {preferences && preferences.length > 0 ? (
                    preferences.map((p: any) => (
                      <div
                        key={p.id}
                        className="rounded-2xl border border-border/40 bg-card p-5 transition hover:shadow-md"
                      >
                        <p className="text-[10px] font-bold text-teal-600 uppercase">
                          {getJoinedField(p.initiatives, "ngos")?.name || "NGO Partner"}
                        </p>
                        <h3 className="mt-1 font-semibold text-primary">{getJoinedField(p.initiatives, "title") || "Initiative Title"}</h3>
                        <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                          {getJoinedField(p.initiatives, "description") || ""}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full p-12 text-center text-muted-foreground border border-dashed rounded-3xl">
                      You haven't selected any initiatives yet.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="h-5 w-5 text-teal-600" />
                  <h2 className="font-display text-2xl font-semibold text-primary">Membership</h2>
                </div>
                {subscription ? (
                  <div className="rounded-3xl border border-teal-600/20 bg-teal-600/5 p-6">
                    <p className="text-sm font-medium text-teal-600 uppercase tracking-wider">
                      Monthly Plan
                    </p>
                    <p className="mt-2 font-display text-3xl font-bold text-teal-700">
                      Rs {Number(subscription.amount_mur).toLocaleString()}
                    </p>
                    <div className="mt-6 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-bold text-teal-600 uppercase">
                          {subscription.status}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Next Billing</span>
                        <span className="font-bold">
                          {subscription.next_billing_date
                            ? new Date(subscription.next_billing_date).toLocaleDateString()
                            : "TBD"}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-3xl border border-dashed p-6 text-center">
                    <p className="text-sm text-muted-foreground">No active subscription found.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
