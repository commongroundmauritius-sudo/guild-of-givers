import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { createLead, convertLead, startMembershipSubscription } from "@/lib/auth-actions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Become a Member — CommonGround" },
      {
        name: "description",
        content: "Pick a monthly contribution and start making long-term impact.",
      },
    ],
  }),
  component: SignupPage,
});

const PRESETS = [350, 450, 900, 2500, 5000, 8000];
const STEPS = ["Amount", "Details", "Payment", "Account", "Done"];

function SignupPage() {
  const [step, setStep] = useState(0);
  const [amount, setAmount] = useState(450);
  const [customAmount, setCustomAmount] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [coversFees, setCoversFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { signUp, role, loading } = useAuth();
  const navigate = useNavigate();

  // Attribution detection
  const [sourceInitiativeId, setSourceInitiativeId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("source_initiative_id");
      if (stored) {
        setSourceInitiativeId(stored);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && role) {
      if (role === "admin") navigate({ to: "/admin-dashboard" });
      else if (role === "organization") navigate({ to: "/organization" });
      else if (role === "member") navigate({ to: "/member" });
    }
  }, [role, loading, navigate]);

  const finalAmount = customAmount ? Number(customAmount) || 0 : amount;

  const submitDetails = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await createLead({
        data: {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          amount: finalAmount,
          coversFees,
        },
      });
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const submitAccount = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { error, data: authResult } = await signUp(email.trim().toLowerCase(), password, {
      full_name: fullName,
      phone: phone,
      subscription_amount: finalAmount,
      covers_fees: coversFees,
      source_initiative_id: sourceInitiativeId,
    });

    if (error) {
      toast.error((error as Error).message);
      setSubmitting(false);
      return;
    }

    const user = authResult?.user;

    try {
      if (user) {
        // Start subscription
        await startMembershipSubscription({
          data: {
            userId: user.id,
            amount: finalAmount,
            billingDate: 7,
            coversFees,
            priorities: sourceInitiativeId ? [sourceInitiativeId] : [],
          },
        });

        // Record conversion event with idempotency check
        const sessionId = sessionStorage.getItem("cg_session_id") || "direct-signup";
        const convKey = `conv_recorded_${sourceInitiativeId}`;

        if (sourceInitiativeId && !sessionStorage.getItem(convKey)) {
          await supabase.from("initiative_events").insert({
            initiative_id: sourceInitiativeId,
            event_type: "registration_conversion",
            user_id: user.id,
            session_id: sessionId,
          });
          sessionStorage.setItem(convKey, "true");
          localStorage.removeItem("source_initiative_id");
        }
      }

      await convertLead({ data: { email: email.trim().toLowerCase() } });
      setStep(4);
    } catch (err) {
      console.error("Post-signup error:", err);
      setStep(4);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <section className="relative overflow-hidden bg-cream-deep/30 py-20 lg:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            {step < 4 && (
              <div className="mb-12">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setStep(Math.max(0, step - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition hover:bg-muted"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {step + 1} of 4: {STEPS[step]}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  {[0, 1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        s <= step ? "bg-primary" : "bg-primary/10"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            {step === 0 && (
              <div>
                <h2 className="font-display text-4xl font-semibold text-primary">
                  Start your monthly impact
                </h2>
                <p className="mt-4 text-lg text-muted-foreground">
                  Your contribution goes directly to vetted initiatives across Mauritius.
                </p>

                <div className="mt-12">
                  <p className="text-sm font-medium">Choose your monthly contribution</p>
                  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {PRESETS.map((p) => {
                      const active = !customAmount && p === amount;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => {
                            setAmount(p);
                            setCustomAmount("");
                          }}
                          className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                            active
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-background hover:border-primary/40"
                          }`}
                        >
                          Rs {p.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>

                  <label className="mt-6 block">
                    <span className="text-sm font-medium">Or enter custom amount (MUR)</span>
                    <div className="mt-2 flex overflow-hidden rounded-xl border border-input bg-background">
                      <span className="px-4 py-2.5 text-sm text-muted-foreground">Rs</span>
                      <input
                        inputMode="numeric"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value.replace(/\D/g, ""))}
                        placeholder=""
                        className="w-full bg-transparent px-2 py-2.5 text-sm outline-none"
                      />
                      <span className="px-4 py-2.5 text-sm text-muted-foreground">/ month</span>
                    </div>
                  </label>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Flexible monthly contribution. Cancel anytime.
                  </p>
                </div>

                <div className="mt-8 rounded-2xl bg-primary/5 p-4 border border-primary/10">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={coversFees}
                      onChange={(e) => setCoversFees(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-primary text-primary focus:ring-primary"
                    />
                    <div>
                      <span className="text-sm font-semibold text-primary">
                        I want to cover the processing fee
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        This adds a small amount (approx. 3.5%) to your contribution so 100% of your
                        Rs {finalAmount.toLocaleString()} goes to the initiatives.
                      </p>
                    </div>
                  </label>
                </div>

                <button
                  disabled={finalAmount <= 0}
                  onClick={() => setStep(1)}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                >
                  Start my monthly impact
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-3xl font-semibold text-primary">Your details</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Contributing Rs {finalAmount.toLocaleString()} / month.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitDetails();
                  }}
                  className="mt-8 space-y-4"
                >
                  <Field label="Full name">
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Email">
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Phone number (optional)">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <button
                    disabled={submitting}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? "Saving details…" : "Continue to payment"}
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-3xl font-semibold text-primary">Payment</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Simulating a secure payment via our abstraction layer.
                  Your CommonGround Member account will be activated immediately after this mock transaction.
                </p>
                <div className="mt-8 rounded-2xl border border-teal-600/20 bg-teal-600/5 p-6">
                  <p className="text-sm font-semibold text-teal-700 uppercase">Order Summary</p>
                  <div className="mt-4 flex justify-between">
                    <span className="text-muted-foreground">Monthly Contribution</span>
                    <span className="font-bold">Rs {finalAmount.toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="mt-8 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Complete Checkout (Mock)
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-display text-3xl font-semibold text-primary">
                  Create your account
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Set a password to manage your membership and track your impact.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitAccount();
                  }}
                  className="mt-8 space-y-4"
                >
                  <Field label="Password">
                    <input
                      required
                      minLength={6}
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                  <button
                    disabled={submitting}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
                  >
                    {submitting ? "Setting up…" : "Complete setup"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="mt-4 block w-full text-center text-sm text-muted-foreground hover:text-primary"
                  >
                    I'll set it up later via email
                  </button>
                </form>
              </div>
            )}

            {step === 4 && (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-7 w-7" />
                </div>
                <h2 className="mt-5 font-display text-3xl font-semibold text-primary">
                  You're in.
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Welcome to CommonGround. Check your email to confirm your account.
                </p>
                <button
                  onClick={() => navigate({ to: "/dashboard" })}
                  className="mt-6 inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Go to dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
