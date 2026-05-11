import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/ngo")({
  component: NgoDashboard,
});

function NgoDashboard() {
  const { signOut } = useAuth();
  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="kicker">Organization</span>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary sm:text-5xl">
                NGO Dashboard
              </h1>
              <p className="mt-2 text-muted-foreground">
                Manage your initiatives, funding cycles, and member updates.
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-full border border-input bg-background px-5 py-2.5 text-sm hover:bg-muted"
            >
              Sign out
            </button>
          </div>
          <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              NGO funding overview, payout history and reporting tools will appear here.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
