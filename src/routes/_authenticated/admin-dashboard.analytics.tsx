import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import {
  BarChart3,
  Target,
  Users,
  Zap,
  DollarSign,
  ShieldCheck
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AcquisitionModule } from "@/components/dashboard/modules/acquisition/components/AcquisitionModule";
import { EngagementModule } from "@/components/dashboard/modules/engagement/components/EngagementModule";
import { FinancialModule } from "@/components/dashboard/modules/financial/components/FinancialModule";
import { ImpactModule } from "@/components/dashboard/modules/impact/components/ImpactModule";
import { CrmModule } from "@/components/dashboard/modules/crm/components/CrmModule";

export const Route = createFileRoute("/_authenticated/admin-dashboard/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  return (
    <SiteLayout>
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-600">
                System Intelligence
              </span>
            </div>
            <h1 className="mt-3 font-display text-4xl font-semibold text-primary">
              Performance Dashboard
            </h1>
            <p className="mt-2 text-muted-foreground">
              A modular view of platform growth, attribution, and financial health.
            </p>
          </div>

          <Tabs defaultValue="acquisition" className="space-y-8">
            <div className="bg-card border border-border/40 p-1.5 rounded-2xl inline-flex w-full overflow-x-auto lg:w-auto no-scrollbar">
              <TabsList className="bg-transparent h-auto gap-1">
                <TabsTrigger
                  value="acquisition"
                  className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
                >
                  <Target className="h-4 w-4" /> Acquisition
                </TabsTrigger>
                <TabsTrigger
                  value="engagement"
                  className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
                >
                  <Zap className="h-4 w-4" /> Engagement
                </TabsTrigger>
                <TabsTrigger
                  value="financial"
                  className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
                >
                  <DollarSign className="h-4 w-4" /> Financial
                </TabsTrigger>
                <TabsTrigger
                  value="impact"
                  className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
                >
                  <Users className="h-4 w-4" /> Impact
                </TabsTrigger>
                <TabsTrigger
                  value="crm"
                  className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
                >
                  <ShieldCheck className="h-4 w-4" /> CRM Foundation
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="acquisition" className="space-y-8 outline-none">
              <AcquisitionModule />
            </TabsContent>

            <TabsContent value="engagement" className="space-y-8 outline-none">
              <EngagementModule />
            </TabsContent>

            <TabsContent value="financial" className="space-y-8 outline-none">
              <FinancialModule />
            </TabsContent>

            <TabsContent value="impact" className="space-y-8 outline-none">
              <ImpactModule />
            </TabsContent>

            <TabsContent value="crm" className="space-y-8 outline-none">
              <CrmModule />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </SiteLayout>
  );
}
