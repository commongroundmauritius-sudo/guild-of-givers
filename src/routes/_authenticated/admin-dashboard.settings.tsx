import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Settings as SettingsIcon, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/admin-dashboard/settings")({
  component: AdminSettings,
});

function AdminSettings() {
  const { user, profile, refreshAuth } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refreshAuth();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <SiteLayout>
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-500">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-display text-3xl font-bold text-primary">Settings</h1>
              <p className="text-muted-foreground">Manage your admin profile and preferences.</p>
            </div>
          </div>

          <div className="space-y-8 rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
            <div className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="fullName" className="text-sm font-semibold">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="avatarUrl" className="text-sm font-semibold">
                  Avatar URL
                </Label>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="rounded-xl"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio" className="text-sm font-semibold">
                  Bio / About
                </Label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Write a short bio..."
                  className="min-h-[120px] w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="pt-4">
              <Button
                onClick={() => mutation.mutate()}
                disabled={mutation.isPending}
                className="w-full sm:w-auto rounded-full bg-amber-500 hover:bg-amber-600 text-white font-bold"
              >
                {mutation.isPending ? "Saving..." : "Save Changes"}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
