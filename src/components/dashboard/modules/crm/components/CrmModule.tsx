import React, { useState } from "react";
import { useCrmSummary } from "../hooks/use-crm-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ListTodo,
  MessageSquare,
  Clock,
  Users,
  AlertCircle,
  BarChart3,
  Filter,
  CheckSquare,
} from "lucide-react";
import { SupporterIntelligence } from "./SupporterIntelligence";
import { SegmentationView } from "./SegmentationView";
import { TaskModule } from "./TaskModule";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function CrmModule({ organizationId }: { organizationId?: string }) {
  const { data, isLoading, isError, error } = useCrmSummary();
  const [activeTab, setActiveTab] = useState("intelligence");

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  if (isError) {
    return (
      <Card className="rounded-3xl border-destructive/20 bg-destructive/5">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <h3 className="text-lg font-bold text-destructive">CRM Access Restricted</h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            {(error as any)?.message || "Authentication or permission error encountered."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeLeadsCount =
    Number(data?.stages?.["Visitor"] || 0) + Number(data?.stages?.["Registered User"] || 0);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Active Leads
            </CardTitle>
            <ListTodo className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(activeLeadsCount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Acquisition funnel</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Supporters
            </CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.stages?.["Supporter"] || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Verified financial contributors</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              CRM Notes
            </CardTitle>
            <MessageSquare className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {Number(data?.notesCount || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Internal notes recorded</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
              Recent Activity
            </CardTitle>
            <Clock className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {data?.recentActivity?.map((activity: any) => (
              <div key={activity.id} className="text-xs border-l-2 border-indigo-600/20 pl-3 py-1">
                <p className="font-bold text-indigo-600 capitalize">
                  {(activity.event_type || "").replace(/_/g, " ")}
                </p>
                <p className="text-muted-foreground mt-0.5 truncate">
                  {activity.profiles?.full_name || "Anonymous"}
                </p>
              </div>
            ))}
            {(!data?.recentActivity || data.recentActivity.length === 0) && (
              <p className="text-xs text-muted-foreground">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="intelligence" onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-2xl mb-6">
          <TabsTrigger value="intelligence" className="rounded-xl flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Intelligence
          </TabsTrigger>
          <TabsTrigger value="segments" className="rounded-xl flex items-center gap-2">
            <Filter className="h-4 w-4" /> Segments
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-xl flex items-center gap-2">
            <CheckSquare className="h-4 w-4" /> Tasks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="intelligence">
          {organizationId && <SupporterIntelligence organizationId={organizationId} />}
        </TabsContent>

        <TabsContent value="segments">
          {organizationId && <SegmentationView organizationId={organizationId} />}
        </TabsContent>

        <TabsContent value="tasks">
          {organizationId && <TaskModule organizationId={organizationId} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
