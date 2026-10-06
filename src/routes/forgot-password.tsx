import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { emailSchema } from "@/lib/security/validators";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot Password — CommonGround" },
      { name: "description", content: "Reset your CommonGround account password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = emailSchema.safeParse(email);
    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    if (submitting) return;
    setSubmitting(true);
    const { error } = await resetPassword(email.trim().toLowerCase());
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setDone(true);
    toast.success("Reset link sent to your email");
  };

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-semibold text-primary sm:text-5xl">
            Reset Password
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          {done ? (
            <div className="mt-8 rounded-3xl border border-green-100 bg-green-50 p-6 text-center">
              <p className="text-sm font-medium text-green-800">
                Check your email for a reset link.
              </p>
              <Link
                to="/login"
                className="mt-4 inline-block text-sm font-medium text-primary underline underline-offset-4"
              >
                Back to login
              </Link>
            </div>
          ) : (
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
              <button
                disabled={submitting}
                className="w-full rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {submitting ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remembered your password?{" "}
            <Link
              to="/login"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Log in
            </Link>
          </p>
        </div>
      </section>
    </SiteLayout>
  );
}
