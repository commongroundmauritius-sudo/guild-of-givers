# Known Issues & Technical Debt

## Header Component Fix

### Context
The mobile header sign-out and authentication button layout needs refinement for better UX on smaller screens.

### Implementation

```tsx
<div className="px-4 pt-4 flex flex-col gap-3">
  {user ? (
    <button
      onClick={() => {
        signOut().then(() => navigate({ to: "/login" }));
        setOpen(false);
      }}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-3.5 text-sm font-bold text-red-600"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  ) : (
    <>
      <Link
        to="/login"
        onClick={() => setOpen(false)}
        className="inline-flex w-full items-center justify-center rounded-full border border-input bg-background px-5 py-3.5 text-sm font-bold text-foreground"
      >
        Log in
      </Link>
      <Link
        to="/signup"
        onClick={() => setOpen(false)}
        className="inline-flex w-full items-center justify-center rounded-full bg-primary px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-sm active:scale-[0.98]"
      >
        Become a Member
      </Link>
    </>
  )}
</div>
```

### Status
✅ Implemented in `src/components/site/Header.tsx`

---

## FAQ Component

### Overview
Dynamic FAQ section for the homepage that supports both default content and customizable items via settings.

### Implementation

```tsx
function FAQ({ settings }: { settings: any }) {
  const defaultFaqs = [
    {
      q: "How does CommonGround membership work?",
      a: "You pick a monthly contribution, choose one or more vetted initiatives, and we handle the rest—recurring billing, allocation, receipts, and impact updates.",
    },
    {
      q: "How are initiatives vetted?",
      a: "Every partner is reviewed for legal status, governance, financial transparency and demonstrated long-term impact before being listed.",
    },
    {
      q: "Can I change or cancel my membership?",
      a: "Yes. You can adjust your monthly amount, switch allocations, pause or cancel anytime from your dashboard.",
    },
    {
      q: "Is my contribution tax-deductible?",
      a: "Where partner Organizations are registered for tax-deductible giving, you'll receive an automated receipt at year-end.",
    },
    {
      q: "How do I know my impact is real?",
      a: "Members receive unified, audited impact reports plus direct field updates from the organizations they support.",
    },
  ];

  const items = settings?.items || defaultFaqs;
  const title = settings?.title || "Questions, answered.";
  const description =
    settings?.description ||
    "Everything you need to know about how CommonGround works, our vetting process, and what your membership unlocks.";

  return (
    <section id="faq" className="border-t border-border/60 bg-white">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1fr_2fr] lg:px-8">
        <div>
          <Kicker>FAQ</Kicker>
          <h2 className="mt-4 font-display text-4xl font-semibold text-primary sm:text-5xl">
            {title}
          </h2>
          <p className="mt-4 text-muted-foreground">{description}</p>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {items.map((f: any, i: number) => (
            <AccordionItem
              key={i}
              value={`q-${i}`}
              className="border-b border-border/60"
            >
              <AccordionTrigger className="text-left font-display text-lg text-primary hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
```

### Status
✅ Implemented in homepage management module

---

## Technical Debt & Future Work

### Performance Optimization
- [ ] Implement Redis caching for frequently accessed metrics
- [ ] Add database query optimization for financial reports
- [ ] Lazy-load dashboard components

### Observability
- [ ] Implement structured logging across all services
- [ ] Add distributed tracing for payment flows
- [ ] Create alerting rules for critical business metrics

### Scalability
- [ ] Implement read replicas for analytics queries
- [ ] Add connection pooling for database
- [ ] Optimize webhook processing for high-volume scenarios

### Testing
- [ ] Expand e2e test coverage for financial flows
- [ ] Add stress testing for allocation engine
- [ ] Implement chaos engineering tests for resilience
