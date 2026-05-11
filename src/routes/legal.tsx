import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/legal")({
  head: () => ({
    meta: [
      { title: "Legal — CommonGround" },
      { name: "description", content: "Terms, privacy and legal information for CommonGround." },
    ],
  }),
  component: LegalPage,
});

function LegalPage() {
  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="kicker">Legal</span>
          <h1 className="mt-4 font-display text-5xl font-semibold text-primary">Legal</h1>
          <div className="mt-8 space-y-8 text-sm leading-relaxed text-muted-foreground">
            <div>
              <h2 className="font-display text-xl text-primary">Terms of service</h2>
              <p className="mt-2">
                By becoming a member, you agree to recurring billing for your selected
                contribution, cancellable at any time. Full terms are available upon request.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl text-primary">Privacy policy</h2>
              <p className="mt-2">
                We collect only the information necessary to operate memberships,
                allocate contributions and produce impact reports. We never sell your data.
              </p>
            </div>
            <div>
              <h2 className="font-display text-xl text-primary">Contact</h2>
              <p className="mt-2">For legal enquiries, reach our team via the Partner page.</p>
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
