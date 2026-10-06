import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Settings as SettingsIcon, Save, User, Phone, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/security/auth-actions";

export const Route = createFileRoute("/_authenticated/member/settings")({
  component: MemberSettings,
});

function MemberSettings() {
  const { user, profile, refreshAuth, role, loading: authLoading, authDataError } = useAuth();
  const navigate = useNavigate();
  const isAuthorizedMember = !authLoading && !authDataError && role === "member";

  useEffect(() => {
    if (authLoading || authDataError) return;
    if (role !== "member") navigate({ to: "/dashboard", replace: true });
  }, [authLoading, authDataError, role, navigate]);

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [address, setAddress] = useState(profile?.address || "");
  const [age, setAge] = useState(profile?.age?.toString() || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("You must be signed in.");

      const trimmedFullName = fullName.trim();
      const trimmedPhone = phone.trim();
      const trimmedAddress = address.trim();
      const trimmedAvatarUrl = avatarUrl.trim();
      const ageValue = age.trim();
      const ageInt = ageValue ? Number(ageValue) : null;

      if (!trimmedFullName) throw new Error("Full name is required");
      if (trimmedFullName.length > 120) throw new Error("Full name must be 120 characters or fewer");
      if (trimmedPhone.length > 20) throw new Error("Phone number must be 20 characters or fewer");
      if (trimmedAddress.length > 500) throw new Error("Address must be 500 characters or fewer");
      if (ageValue && (!Number.isInteger(ageInt) || ageInt < 13 || ageInt > 120)) {
        throw new Error("Age must be a whole number between 13 and 120");
      }
      if (trimmedAvatarUrl && !/^https?:\/\//i.test(trimmedAvatarUrl)) {
        throw new Error("Avatar URL must start with http:// or https://");
      }

      await updateProfile({
        data: {
          data: {
            full_name: trimmedFullName,
            phone: trimmedPhone || null,
            address: trimmedAddress || null,
            age: ageInt,
            avatar_url: trimmedAvatarUrl || null,
          },
        },
      });
    },
    onSuccess: () => {
      toast.success("Profile updated successfully");
      refreshAuth();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!isAuthorizedMember) return null;

  return (
    <section className="py-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-teal-600/10 text-teal-600">
            <SettingsIcon aria-hidden="true" className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-primary">Settings</h1>
            <p className="text-muted-foreground">Update your personal details and account info.</p>
          </div>
        </div>

        <div className="space-y-8 rounded-3xl border border-border/40 bg-card p-8 shadow-sm">
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="fullName" className="text-sm font-semibold">Full Name</Label>
              <div className="relative">
                <User aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" className="pl-10 rounded-xl" maxLength={120} autoComplete="name" required />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-sm font-semibold">Phone Number</Label>
              <div className="relative">
                <Phone aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+230 ..." className="pl-10 rounded-xl" maxLength={20} autoComplete="tel" inputMode="tel" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="age" className="text-sm font-semibold">Age</Label>
              <div className="relative">
                <Calendar aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="age" type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" className="pl-10 rounded-xl" min="13" max="120" step="1" inputMode="numeric" />
              </div>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="address" className="text-sm font-semibold">Address</Label>
              <div className="relative">
                <MapPin aria-hidden="true" className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Residential address" maxLength={500} autoComplete="street-address" className="min-h-[80px] w-full rounded-xl border border-input bg-background pl-10 pr-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" />
              </div>
            </div>

            <div className="grid gap-2 sm:col-span-2">
              <Label htmlFor="avatarUrl" className="text-sm font-semibold">Avatar URL</Label>
              <Input id="avatarUrl" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://example.com/avatar.jpg" className="rounded-xl" maxLength={500} inputMode="url" autoComplete="url" />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full sm:w-auto rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold px-8">
              {mutation.isPending ? "Saving..." : "Save Changes"}
              <Save aria-hidden="true" className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
