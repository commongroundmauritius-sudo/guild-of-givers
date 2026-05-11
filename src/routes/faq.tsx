import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQS = [
  { q: "How does CommonGround membership work?", a: "Pick a monthly contribution, choose vetted initiatives, and we handle billing, allocation, receipts and impact reports." },
  { q: "How are initiatives vetted?", a: "Every partner is reviewed for legal status, governance, financial transparency and demonstrated long-term impact." },
  { q: "Can I change or cancel my membership?", a: "Yes — adjust your amount, switch allocations, pause or cancel from your dashboard anytime." },
  { q: "Is my contribution tax-deductible?", a: "Where partner NGOs are eligible, you'll receive automated tax-deductible receipts." },
  { q: "How do I know my impact is real?", a: "You receive unified audited reports and direct field updates from the organizations you support." },
];

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ — CommonGround" },
      { name: "description", content: "Answers about CommonGround membership, vetting and impact." },
    ],
  }),
  component: FAQPage,
});

function FAQPage() {
  return (
    <SiteLayout>
      <section>
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
          <span className="kicker">FAQ</span>
          <h1 className="mt-4 font-display text-5xl font-semibold text-primary sm:text-6xl">
            Questions, answered.
          </h1>
          <Accordion type="single" collapsible className="mt-10">
            {FAQS.map((f, i) => (
              <AccordionItem key={f.q} value={`q-${i}`} className="border-b border-border/60">
                <AccordionTrigger className="text-left font-display text-lg text-primary hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>
    </SiteLayout>
  );
}
