const fs = require('fs');
let content = fs.readFileSync('src/routes/signup.tsx', 'utf8');

// 1. Add import
if (!content.includes('startMembershipSubscription')) {
  content = content.replace(
    'import { createLead, convertLead } from "@/lib/auth-actions";',
    'import { createLead, convertLead, startMembershipSubscription } from "@/lib/auth-actions";'
  );
}

// 2. Update step 2 UI
const step2Match = content.match(/\{step === 2 && \([\s\S]*?Continue\s*<\/button>\s*<\/div>\s*?\)\}/);
if (step2Match) {
    const newStep2 = `{step === 2 && (
              <div>
                <h2 className="font-display text-3xl font-semibold text-primary">Payment</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Simulating a secure payment via our abstraction layer.
                  In production, this will redirect to Peach Payments.
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
            )}`;
    content = content.replace(step2Match[0], newStep2);
}

// 3. Update submitAccount logic
const submitMatch = content.match(/const submitAccount = async \(\) => \{[\s\S]*?setStep\(4\);\s*?\};/);
if (submitMatch) {
    const newSubmitAccount = `const submitAccount = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { error, data: authResult } = await signUp(email.trim().toLowerCase(), password, {
      full_name: fullName,
      phone: phone,
      subscription_amount: finalAmount,
      covers_fees: coversFees,
    });

    if (error) {
      toast.error((error as Error).message);
      setSubmitting(false);
      return;
    }

    // After account creation, trigger the subscription via abstraction layer
    try {
      const user = authResult?.user;
      if (user) {
        await startMembershipSubscription({
          data: {
            userId: user.id,
            amount: finalAmount,
            billingDate: 7,
            coversFees,
            priorities: [], // Default empty, user will set in dashboard
          },
        });
      }

      await convertLead({ data: { email: email.trim().toLowerCase() } });
    } catch (e) {
      console.error("Post-signup processing failed", e);
    }

    setSubmitting(false);
    toast.success("Account created — check your inbox to confirm.");
    setStep(4);
  };`;
    content = content.replace(submitMatch[0], newSubmitAccount);
}

fs.writeFileSync('src/routes/signup.tsx', content);
