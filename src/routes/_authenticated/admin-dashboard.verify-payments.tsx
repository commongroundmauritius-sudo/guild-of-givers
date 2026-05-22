import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { useState } from "react";
import { simulatePaymentEvent, simulateBillingCycle } from "@/lib/payments/simulation-actions";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin-dashboard/verify-payments")({
  component: VerifyPaymentsPage,
});

function VerifyPaymentsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTest = async () => {
    if (!user) return;
    setLoading(true);
    setResults([]);

    try {
      // 1. Simulate Success
      const txnId = "verify_" + Date.now();
      const res = await simulatePaymentEvent({
        data: {
          type: "payment.success",
          userId: user.id,
          amount: 1000,
          subscriptionId: "sub_" + txnId
        }
      });

      // 2. Verify DB
      const { data: payments } = await supabase
        .from("payments")
        .select("*, allocations(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const latest = payments?.[0];
      const passSplit = latest?.amount_mur === 1000;
      const totalAllocated = latest?.allocations?.reduce((s: number, a: any) => s + Number(a.amount_mur), 0) || 0;
      const passNGO = totalAllocated === 800; // 80%

      setResults([
        { name: "20/80 Split Logic", status: passNGO ? "PASS" : "FAIL", detail: `Allocated MUR ${totalAllocated} from MUR 1000 total.` },
        { name: "Payment Persistence", status: latest ? "PASS" : "FAIL", detail: latest ? `Record found with ID ${latest.id}` : "No record found" },
        { name: "Allocation records", status: latest?.allocations?.length > 0 ? "PASS" : "FAIL", detail: `Found ${latest?.allocations?.length || 0} allocation(s)` }
      ]);

      toast.success("Verification complete");
    } catch (err) {
      console.error(err);
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Payment System Verification</h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>End-to-End Test</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-muted-foreground">
              This will trigger a mock MUR 1000 payment for your account and verify the 20/80 split and database persistence.
            </p>
            <Button onClick={runTest} disabled={loading}>
              {loading ? "Verifying..." : "Run E2E Verification"}
            </Button>
          </CardContent>
        </Card>

        {results.length > 0 && (
          <div className="space-y-4">
            {results.map((r, i) => (
              <div key={i} className="p-4 rounded-xl border flex items-center justify-between">
                <div>
                  <p className="font-bold">{r.name}</p>
                  <p className="text-sm text-muted-foreground">{r.detail}</p>
                </div>
                <span className={`font-bold ${r.status === "PASS" ? "text-green-600" : "text-red-600"}`}>
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  );
}
