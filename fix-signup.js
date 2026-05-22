const fs = require('fs');
let content = fs.readFileSync('src/routes/signup.tsx', 'utf8');

// Ensure import exists
if (!content.includes('startMembershipSubscription')) {
  content = content.replace(
    'import { createLead, convertLead } from "@/lib/auth-actions";',
    'import { createLead, convertLead, startMembershipSubscription } from "@/lib/auth-actions";'
  );
}

// Replace step 2 UI
const oldStep2Regex = /\{step === 2 && \([\s\S]*?Continue\s*<\/button>\s*<\/div>\s*?\)\}/;
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

content = content.replace(oldStep2Regex, newStep2);

// Replace submitAccount logic
const oldSubmitAccountRegex = /const submitAccount = async \(\) => \{[\s\S]*?setStep\(4\);\s*?\};/;
const newSubmitAccount = `const submitAccount = async () => {
    if (submitting) return;
    setSubmitting(true);
    const { error, data: authData } = await signUp(email.trim().toLowerCase(), password, {
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
      const user = (authData as any)?.user || (authData as any)?.data?.user;
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

content = content.replace(oldSubmitAccountRegex, newSubmitAccount);

fs.writeFileSync('src/routes/signup.tsx', content);
