import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Lock } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";
import { createLead, convertLead } from "@/lib/auth-actions";
import { attributionService } from "@/lib/attribution-service";
import { toast } from "sonner";
import { emailSchema, nameSchema } from "@/lib/security/validators";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

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
  const search = useSearch({ from: "/signup" }) as any;
  const [step, setStep] = useState(search.code ? 3 : 0);
  const [amount, setAmount] = useState(450);
  const [customAmount, setCustomAmount] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [coversFees, setCoversFees] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signupCode, setSignupCode] = useState(search.code || "");
  const [isPartnerSignup, setIsPartnerSignup] = useState(!!search.code);
  const [partnerData, setPartnerData] = useState<any>(null);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [sourceInitiativeId, setSourceInitiativeId] = useState<string | null>(null);

  useEffect(() => {
    attributionService.captureFromUrl();
    const stored = localStorage.getItem("source_initiative_id");
    if (stored) setSourceInitiativeId(stored);

    if (signupCode) {
      verifySignupCode(signupCode);
    }
  }, [signupCode]);

  const verifySignupCode = async (code: string) => {
    const { data, error } = await supabase
      .from("partner_applications")
      .select("*, converted_organization_id")
      .eq("signup_code", code)
      .eq("status", "converted")
      .single();

    if (error || !data) {
      toast.error("Invalid or expired access code.");
      setIsPartnerSignup(false);
      setSignupCode("");
      setStep(0);
      return;
    }

    setPartnerData(data);
    setEmail(data.email);
    setFullName(data.organization_name);
    setIsPartnerSignup(true);
    setStep(3);
  };

  const finalAmount = customAmount ? parseInt(customAmount) : amount;

  const submitDetails = async () => {
    if (submitting) return;

    const validation = z
      .object({
        email: emailSchema,
        fullName: nameSchema,
        amount: z.number().positive(),
      })
      .safeParse({
        email,
        fullName,
        amount: finalAmount,
      });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const attribution = attributionService.getStored();
      await createLead({
        data: {
          email: email.trim().toLowerCase(),
          fullName: fullName.trim(),
          phone: phone.trim(),
          amount: finalAmount,
          coversFees,
          status: "started",
          sourceInitiativeId,
          attribution,
        },
      });
      setStep(2);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentCompletion = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await convertLead({
        data: { email: email.trim().toLowerCase(), status: "converted", sourceInitiativeId },
      });
      setStep(3);
    } catch (err) {
      toast.error("Failed to process payment status.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitAccount = async () => {
    if (submitting) return;

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSubmitting(true);

    const role = isPartnerSignup ? "organization" : "member";
    const signUpData: any = {
      full_name: fullName.trim(),
      phone: phone.trim(),
      subscription_amount: isPartnerSignup ? 0 : finalAmount,
      covers_fees: isPartnerSignup ? false : coversFees,
      source_initiative_id: sourceInitiativeId,
      role: role,
    };

    if (isPartnerSignup && partnerData?.converted_organization_id) {
      signUpData.organization_id = partnerData.converted_organization_id;
    }

    const { error } = await signUp(email.trim().toLowerCase(), password, signUpData);

    if (error) {
      toast.error((error as Error).message);
      setSubmitting(false);
      return;
    }

    if (isPartnerSignup) {
      // Clear code after use
      await supabase
        .from("partner_applications")
        .update({ signup_code: null } as any)
        .eq("id", partnerData.id);
    }

    setStep(4);
    setSubmitting(false);
  };

  return (
    <SiteLayout>
      <section className="bg-cream-deep/40 py-20 lg:py-32 min-h-screen">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl bg-white rounded-[3rem] p-8 sm:p-16 shadow-2xl shadow-primary/5">
            <div className="mb-12">
              <div className="flex gap-2 mb-8">
                {STEPS.map((s, i) => (
                  <div
                    key={s}
                    className={`h-1.5 flex-1 rounded-full ${
                      i <= step ? "bg-primary" : "bg-primary/10"
                    }`}
                  />
                ))}
              </div>
              {step > 0 && step < 4 && !isPartnerSignup && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              )}
            </div>

            {isPartnerSignup && step === 3 && (
              <div className="mb-8 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center gap-4">
                <div className="h-10 w-10 bg-indigo-600 rounded-full flex items-center justify-center text-white shrink-0">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-indigo-900">Partner Access Verified</p>
                  <p className="text-xs text-indigo-700">
                    Setting up account for: {partnerData?.organization_name}
                  </p>
                </div>
              </div>
            )}

            {step === 0 && (
              <div>
                <h2 className="font-display text-4xl font-bold text-primary">
                  Monthly Contribution
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Pick an amount that reflects the impact you want to make. You can adjust this
                  anytime.
                </p>

                <div className="mt-10">
                  <div className="grid gap-3 sm:grid-cols-3">
                    {PRESETS.map((p) => {
                      const active = !customAmount && p === amount;
                      return (
                        <button
                          key={p}
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
                  className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
                >
                  Start my monthly impact
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="font-display text-4xl font-bold text-primary">Your details</h2>
                <p className="mt-4 text-muted-foreground">
                  Contributing Rs {finalAmount.toLocaleString()} / month.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitDetails();
                  }}
                  className="mt-10 space-y-5"
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
                    className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? "Saving details…" : "Continue to payment"}
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="font-display text-4xl font-bold text-primary">Secure Payment</h2>
                <p className="mt-4 text-muted-foreground">
                  Complete your checkout via our secure payment gateway.
                </p>
                <div className="mt-10 rounded-3xl border border-primary/10 bg-primary/5 p-8">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">
                    Order Summary
                  </p>
                  <div className="mt-6 flex justify-between border-b border-primary/10 pb-4">
                    <span className="text-muted-foreground">Contribution</span>
                    <span className="font-bold text-primary">
                      Rs {finalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-4 flex justify-between">
                    <span className="font-bold text-primary">Total Recurring</span>
                    <span className="font-bold text-primary text-xl">
                      Rs {finalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handlePaymentCompletion}
                  disabled={submitting}
                  className="mt-10 inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
                >
                  {submitting ? "Processing..." : "Complete Checkout (Mock)"}
                </button>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="font-display text-4xl font-bold text-primary">
                  Create your account
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Set a password to manage your {isPartnerSignup ? "organization" : "membership"}{" "}
                  and track your impact.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitAccount();
                  }}
                  className="mt-10 space-y-5"
                >
                  {isPartnerSignup && (
                    <Field label="Email Address">
                      <input disabled value={email} className={inputCls + " opacity-60"} />
                    </Field>
                  )}
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
                    className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-60"
                  >
                    {submitting ? "Setting up…" : "Complete setup"}
                  </button>
                  {!isPartnerSignup && (
                    <button
                      type="button"
                      onClick={() => setStep(4)}
                      className="mt-6 block w-full text-center text-sm font-bold text-primary hover:underline"
                    >
                      I'll set it up later via email
                    </button>
                  )}
                </form>
              </div>
            )}

            {step === 4 && (
              <div className="text-center py-10">
                <div className="mx-auto grid h-24 w-24 place-items-center rounded-full bg-forest/10 text-forest mb-8">
                  <Check className="h-12 w-12" />
                </div>
                <h2 className="font-display text-4xl font-bold text-primary">
                  Welcome to CommonGround
                </h2>
                <p className="mt-4 text-muted-foreground leading-relaxed max-w-sm mx-auto">
                  {isPartnerSignup
                    ? `Your organization account for ${partnerData?.organization_name} is ready.`
                    : "Your monthly impact has started. Check your email for your receipt and account confirmation."}
                </p>
                <button
                  onClick={() => navigate({ to: isPartnerSignup ? "/organization" : "/dashboard" })}
                  className="mt-10 inline-flex items-center justify-center rounded-full bg-primary px-10 py-4 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95"
                >
                  Go to my Dashboard
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
  "w-full rounded-2xl border border-input bg-background px-5 py-3.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm transition-all";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-bold text-primary uppercase tracking-widest">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
