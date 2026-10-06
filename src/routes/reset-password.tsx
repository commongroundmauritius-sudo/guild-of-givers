import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — CommonGround" },
      { name: "description", content: "Set a new password for your CommonGround account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { updatePassword, session, loading } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Supabase handles the password reset flow by creating a session
    // when clicking the link. If there's no session and we're not loading,
    // they shouldn't be here.
    if (!loading && !session) {
      toast.error("Session expired or invalid link");
      navigate({ to: "/login" });
    }
  }, [session, loading, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password updated successfully");
    navigate({ to: "/dashboard", replace: true });
  };

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-3xl px-4 py-32 text-center text-muted-foreground">
          Loading...
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-semibold text-primary sm:text-5xl">
            New Password
          </h1>
          <p className="mt-2 text-muted-foreground">Please enter your new password below.</p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-3xl border border-border/60 bg-card p-6"
          >
            <label className="block">
              <span className="text-sm font-medium">New Password</span>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="new-password"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Confirm New Password</span>
              <input
                required
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <button
              disabled={submitting}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}
