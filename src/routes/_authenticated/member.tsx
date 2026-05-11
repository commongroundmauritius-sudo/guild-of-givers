import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/member")({
  component: MemberDashboard,
});

function MemberDashboard() {
  const { user, signOut } = useAuth();
  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="kicker">Member</span>
              <h1 className="mt-3 font-display text-4xl font-semibold text-primary sm:text-5xl">
                Welcome, {user?.email?.split("@")[0]}
              </h1>
              <p className="mt-2 text-muted-foreground">
                Your monthly contribution overview will appear here.
              </p>
            </div>
            <button
              onClick={signOut}
              className="rounded-full border border-input bg-background px-5 py-2.5 text-sm hover:bg-muted"
            >
              Sign out
            </button>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { title: "Monthly contribution", value: "—" },
              { title: "Active allocations", value: "0" },
              { title: "Lifetime impact", value: "—" },
            ].map((c) => (
              <div key={c.title} className="rounded-3xl border border-border/40 bg-card p-6">
                <p className="text-sm text-muted-foreground">{c.title}</p>
                <p className="mt-3 font-display text-3xl text-primary">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-3xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              Subscription, allocations, receipts and contribution history will appear here once
              backend data is connected.
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
