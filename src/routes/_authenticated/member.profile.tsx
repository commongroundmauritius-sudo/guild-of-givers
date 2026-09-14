import { getJoinedField } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Mail, MapPin, Phone, CreditCard, Calendar, Pause, Play, XCircle, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/member/profile")({ component: MemberProfile });

function MemberProfile() {
  const { user, profile, isSubscribed } = useAuth();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState(167);
  const [billingDay, setBillingDay] = useState(7);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const { data: subscription } = useQuery({
    queryKey: ["member-subscription-detail", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("subscriptions").select("*").eq("user_id", user?.id ?? "").in("status", ["active", "paused"]).order("created_at", { ascending: false }).limit(1);
      if (error) throw error;
      const current = data?.[0];
      if (current) {
        setAmount(Number(current.pending_amount_mur ?? current.amount_mur));
        setBillingDay(Number(current.pending_billing_day ?? (current.next_billing_date ? new Date(current.next_billing_date).getDate() : 7)));
      }
      return current;
    },
    enabled: !!user?.id,
  });

  const manage = async (action: "pause" | "resume" | "cancel" | "update") => {
    setSaving(true); setMessage(null);
    const { error } = await supabase.rpc("manage_member_subscription", {
      p_action: action,
      p_amount_mur: action === "update" ? Number(amount) : null,
      p_billing_day: action === "update" || action === "resume" ? Number(billingDay) : null,
    });
    if (error) setMessage(error.message);
    else {
      setMessage(action === "pause" ? "Your membership is paused." : action === "resume" ? "Your membership is active again." : action === "cancel" ? "Your membership has been cancelled." : "Your membership changes will apply from the next billing cycle.");
      await queryClient.invalidateQueries({ queryKey: ["member-subscription-detail", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["auth-data", user?.id] });
    }
    setSaving(false);
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Member";
  const initials = displayName.substring(0, 2).toUpperCase();
  const currentAmount = subscription ? Number(subscription.amount_mur) : amount;
  const currentBillingDay = subscription?.next_billing_date ? new Date(subscription.next_billing_date).getDate() : 7;
  const hasPendingChanges = !!subscription?.pending_amount_mur || !!subscription?.pending_billing_day;

  return (
    <SiteLayout>
      <section className="bg-muted/30 py-16"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-teal-600/20 bg-card shadow-xl"><div className="h-32 bg-teal-600/10" /><div className="relative px-8 pb-8"><div className="absolute -top-16 left-8"><Avatar className="h-32 w-32 border-4 border-card shadow-lg"><AvatarImage src={profile?.avatar_url || ""} /><AvatarFallback className="bg-teal-100 text-3xl font-bold text-teal-700">{initials}</AvatarFallback></Avatar></div><div className="pt-20"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="flex items-center gap-3"><h1 className="font-display text-3xl font-bold text-primary">{displayName}</h1>{isSubscribed ? <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-bold uppercase text-teal-700">Active Member</span> : <span className="rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase text-muted-foreground">Guest User</span>}</div><div className="mt-4 flex flex-wrap gap-6 text-sm text-muted-foreground"><div className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{user?.email}</div>{profile?.phone && <div className="flex items-center gap-1.5"><Phone className="h-4 w-4" />{profile.phone}</div>}{profile?.age && <div className="flex items-center gap-1.5"><Calendar className="h-4 w-4" />{profile.age} years old</div>}{profile?.address && <div className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{profile.address}</div>}</div></div></div></div></div></div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3"><div className="lg:col-span-2 space-y-8"><div><div className="mb-6 flex items-center gap-2"><Heart className="h-5 w-5 text-teal-600" /><h2 className="font-display text-2xl font-semibold text-primary">Supported Initiatives</h2></div><div className="grid gap-4 sm:grid-cols-2">{preferences?.length ? preferences.map((p: any) => <div key={p.id} className="rounded-2xl border border-border/40 bg-card p-5 transition hover:shadow-md"><p className="text-[10px] font-bold uppercase text-teal-600">{getJoinedField(p.initiatives, "organizations")?.organization_name || "Organization Partner"}</p><h3 className="mt-1 font-semibold text-primary">{getJoinedField(p.initiatives, "title") || "Initiative Title"}</h3><p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{getJoinedField(p.initiatives, "description") || ""}</p></div>) : <div className="col-span-full rounded-3xl border border-dashed p-12 text-center text-muted-foreground">You haven't selected any initiatives yet.</div>}</div></div></div>

          <div className="space-y-8"><div><div className="mb-6 flex items-center gap-2"><CreditCard className="h-5 w-5 text-teal-600" /><h2 className="font-display text-2xl font-semibold text-primary">Membership</h2></div>{subscription ? <div className="rounded-3xl border border-teal-600/20 bg-teal-600/5 p-6"><p className="text-sm font-medium uppercase tracking-wider text-teal-600">Monthly Plan</p><p className="mt-2 font-display text-3xl font-bold text-teal-700">Rs {currentAmount.toLocaleString()}</p>{hasPendingChanges && <p className="mt-1 text-xs font-medium text-amber-700">Pending next cycle: Rs {Number(subscription.pending_amount_mur ?? currentAmount).toLocaleString()} {subscription.pending_billing_day ? `on day ${subscription.pending_billing_day}` : ""}</p>}<div className="mt-6 space-y-3"><div className="flex justify-between text-xs"><span className="text-muted-foreground">Status</span><span className="font-bold uppercase text-teal-600">{subscription.status}</span></div><div className="flex justify-between text-xs"><span className="text-muted-foreground">Next Billing</span><span className="font-bold">{subscription.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString() : "Not scheduled"}</span></div></div>

              <div className="mt-6 border-t border-teal-600/10 pt-6"><h3 className="font-semibold text-primary">Manage membership</h3><p className="mt-1 text-xs text-muted-foreground">Changes to your amount or billing day are scheduled for the next billing cycle. Your initiative priorities stay saved.</p><div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="text-xs font-medium">Monthly amount<input type="number" min={167} step="1" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm" /></label><label className="text-xs font-medium">Billing day (1–28)<input type="number" min={1} max={28} value={billingDay} onChange={(e) => setBillingDay(Number(e.target.value))} className="mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm" /></label></div><button disabled={saving} onClick={() => manage("update")} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"><Save className="h-4 w-4" />Save changes</button>
                <div className="mt-4 flex flex-wrap gap-2"><button disabled={saving || subscription.status !== "active"} onClick={() => manage("pause")} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-50"><Pause className="h-4 w-4" />Pause</button><button disabled={saving || subscription.status !== "paused"} onClick={() => manage("resume")} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm disabled:opacity-50"><Play className="h-4 w-4" />Resume</button><button disabled={saving} onClick={() => { if (window.confirm("Cancel your membership? You can no longer resume this membership.")) manage("cancel"); }} className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 px-3 py-2 text-sm text-destructive disabled:opacity-50"><XCircle className="h-4 w-4" />Cancel</button></div>{message && <p role="status" className="mt-3 text-xs text-muted-foreground">{message}</p>}</div></div> : <div className="rounded-3xl border border-dashed p-6 text-center"><p className="text-sm text-muted-foreground">No active subscription found.</p></div>}</div></div>
        </div>
      </div></section>
    </SiteLayout>
  );
}
