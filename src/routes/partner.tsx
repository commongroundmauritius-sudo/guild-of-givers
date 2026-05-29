import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { toast } from "sonner";
import { submitPartnerApplication } from "@/lib/partner/actions";

export const Route = createFileRoute("/partner")({
  head: () => ({
    meta: [
      { title: "Partner With Us — CommonGround" },
      {
        name: "description",
        content: "Apply to join the CommonGround Organization network.",
      },
    ],
  }),
  component: PartnerPage,
});

const ORG_TYPES = [
  "NGO / Nonprofit",
  "Social Enterprise",
  "Community Group",
  "Corporate / Business",
  "Educational Institution",
  "Government / Public Sector",
  "Foundation",
  "Religious Organization",
  "Volunteer Network",
  "Other",
];

function PartnerPage() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      organization_name: formData.get("organization_name") as string,
      organization_type: formData.get("organization_type") as string,
      registration_number: formData.get("registration_number") as string,
      email: formData.get("email") as string,
      message: formData.get("message") as string,
    };

    try {
      await submitPartnerApplication({ data: payload });
      toast.success("Application received. Our team will be in touch.");
      (e.target as HTMLFormElement).reset();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="kicker">Partner With Us</span>
          <h1 className="mt-4 font-display text-5xl font-semibold text-primary sm:text-6xl">
            Apply to join the CommonGround network
          </h1>
          <p className="mt-4 text-muted-foreground">
            We partner with Organizations working on long-horizon causes — restoration,
            conservation, education and social impact. Tell us about your work and our team will get
            back to you.
          </p>

          <ul className="mt-6 grid gap-2 text-sm sm:grid-cols-3">
            {[
              "Recurring monthly funding",
              "Verified, transparent process",
              "Member visibility & reporting",
            ].map((t) => (
              <li
                key={t}
                className="rounded-full border border-border/60 bg-card px-4 py-2 text-center"
              >
                {t}
              </li>
            ))}
          </ul>

          <form
            className="mt-10 space-y-5 rounded-3xl border border-border/60 bg-card p-8"
            onSubmit={handleSubmit}
          >
            <Field label="Organization name" required>
              <input required name="organization_name" className={inputCls} />
            </Field>

            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Organization type" required>
                <select required name="organization_type" className={inputCls}>
                  <option value="">Select type...</option>
                  {ORG_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Registration number" required>
                <input required name="registration_number" className={inputCls} />
              </Field>
            </div>

            <Field label="Email address" required>
              <input required type="email" name="email" className={inputCls} />
            </Field>

            <Field label="Write to us" required>
              <textarea
                required
                minLength={20}
                maxLength={2000}
                rows={6}
                name="message"
                className={inputCls}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Minimum 20 characters — max 2000.
              </p>
            </Field>

            <p className="text-xs text-muted-foreground">
              By submitting, you agree to be contacted by the CommonGround team.
            </p>

            <button
              disabled={submitting}
              className="inline-flex w-full items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60 sm:w-auto"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </button>
          </form>
        </div>
      </section>
    </SiteLayout>
  );
}

const inputCls =
  "w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none ring-0 transition focus:border-primary focus:ring-2 focus:ring-primary/20";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-foreground">
        {label} {required && <span className="text-primary">*</span>}
      </span>
      <div className="mt-2">{children}</div>
    </label>
  );
}
