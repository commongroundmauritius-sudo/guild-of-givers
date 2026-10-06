import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import {
  BarChart3,
  Target,
  Users,
  Zap,
  DollarSign,
  ShieldCheck,
  Search,
  Eye,
  TrendingUp,
  ShieldAlert,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AcquisitionModule } from "@/components/dashboard/modules/acquisition/components/AcquisitionModule";
import { EngagementModule } from "@/components/dashboard/modules/engagement/components/EngagementModule";
import { FinancialModule } from "@/components/dashboard/modules/financial/components/FinancialModule";
import { ImpactModule } from "@/components/dashboard/modules/impact/components/ImpactModule";
import { CrmModule } from "@/components/dashboard/modules/crm/components/CrmModule";
import { ModerationModule } from "@/components/dashboard/modules/moderation/components/ModerationModule";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/_authenticated/admin-dashboard/analytics")({
  component: AdminAnalyticsPage,
});

function AdminAnalyticsPage() {
  const { user, role } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: initiatives, isLoading: initiativesLoading, isError: initiativesError } = useQuery({
    queryKey: ["admin-initiatives-stats"],
    enabled: !!user && (role === "admin" || role === "super_admin"),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("initiatives")
        .select(
          "id, title, view_count, conversion_count, active_supporter_count, inactive_supporter_count, organizations(organization_name)",
        )
        .order("conversion_count", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filteredInitiatives = initiatives?.filter((i) =>
    i.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    
      <section className="bg-muted/30 min-h-screen py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
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

            <div className="w-full md:w-80">
              <ModerationModule />
            </div>
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
                  value="initiatives"
                  className="rounded-xl px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
                >
                  <TrendingUp className="h-4 w-4" /> Initiatives
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

            <TabsContent value="initiatives" className="space-y-8 outline-none">
              <Card className="rounded-3xl border-border/40">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-xl font-semibold">Initiative Performance</CardTitle>
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search initiatives..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 rounded-xl"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  {initiativesError ? (
                    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
                      Unable to load initiative analytics. Please refresh and try again.
                    </div>
                  ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Initiative</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-right">Views</TableHead>
                        <TableHead className="text-right">Conversions</TableHead>
                        <TableHead className="text-right">Active</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInitiatives?.map((initiative) => (
                        <TableRow key={initiative.id}>
                          <TableCell className="font-medium">{initiative.title}</TableCell>
                          <TableCell>
                            {(initiative as any).organizations?.organization_name}
                          </TableCell>
                          <TableCell className="text-right">{initiative.view_count || 0}</TableCell>
                          <TableCell className="text-right">
                            {initiative.conversion_count || 0}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-emerald-600">
                            {initiative.active_supporter_count || 0}
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredInitiatives || filteredInitiatives.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            {initiativesLoading
                              ? "Loading data..."
                              : "No initiatives found matching your search."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="crm" className="space-y-8 outline-none">
              <CrmModule />
            </TabsContent>
          </Tabs>
        </div>
      </section>
    
  );
}
