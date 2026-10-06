import { useMemberCheck } from "@/hooks/use-member-check";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { emailSchema } from "@/lib/security/validators";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — CommonGround" },
      { name: "description", content: "Log in to your CommonGround account." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { handleMemberAction } = useMemberCheck();
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    const { error } = await signIn(email.trim().toLowerCase(), password);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome back");
    navigate({ to: "/dashboard", replace: true });
  };

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-semibold text-primary sm:text-5xl">
            Welcome back
          </h1>
          <p className="mt-2 text-muted-foreground">Log in to your CommonGround account.</p>

          <form
            onSubmit={onSubmit}
            className="mt-8 space-y-4 rounded-3xl border border-border/60 bg-card p-6"
          >
            <label className="block">
              <span className="text-sm font-medium">Email</span>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="email"
              />
            </label>
            <label className="block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Password</span>
                <Link
                  to="/forgot-password"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                autoComplete="current-password"
              />
            </label>
            <button
              disabled={submitting}
              className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="h-px flex-1 bg-border" />
              <span>or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              onClick={signInWithGoogle}
              className="w-full rounded-full border border-input bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-muted"
            >
              Continue with Google
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              to="/signup"
              onClick={handleMemberAction}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Become a member
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
