import { useSupporterProfile } from "@/hooks/crm/use-supporter-profile";
import { EngagementBadge } from "./EngagementBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SupporterTimeline } from "./SupporterTimeline";
import { User, Mail, Phone, Calendar, Target, Award } from "lucide-react";

export function SupporterProfile({ profileId }: { profileId: string }) {
  const { data: profile, isLoading } = useSupporterProfile(profileId);

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Card className="rounded-3xl border-border/40 overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <CardContent className="pt-0 -mt-12 text-center">
            <div className="inline-block p-1 bg-background rounded-full mb-4">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  profile?.full_name?.charAt(0) || <User className="h-12 w-12" />
                )}
              </div>
            </div>
            <h2 className="text-2xl font-bold">{profile?.full_name}</h2>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest">
              {profile?.lifecycle_stage || "Registered User"}
            </div>

            <div className="mt-3 flex justify-center">
              <EngagementBadge userId={profileId} />
            </div>

            <div className="mt-8 space-y-4 text-left">
              <ProfileItem
                icon={<Mail className="h-4 w-4" />}
                label="Email"
                value={profile?.email}
              />
              <ProfileItem
                icon={<Phone className="h-4 w-4" />}
                label="Phone"
                value={profile?.phone || "Not provided"}
              />
              <ProfileItem
                icon={<Calendar className="h-4 w-4" />}
                label="Joined"
                value={
                  profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "-"
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" /> Supported Initiatives
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {profile?.member_preferences?.map((pref: any) => (
                <div
                  key={pref.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-2xl"
                >
                  <span className="text-sm font-medium">{pref.initiatives?.title}</span>
                  <Award className="h-4 w-4 text-amber-500" />
                </div>
              ))}
              {(!profile?.member_preferences || profile.member_preferences.length === 0) && (
                <p className="text-xs text-muted-foreground italic">
                  No initiatives supported yet.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <SupporterTimeline profileId={profileId} />
      </div>
    </div>
  );
}

function ProfileItem({ icon, label, value }: { icon: any; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 bg-muted rounded-xl text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
          {label}
        </p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
