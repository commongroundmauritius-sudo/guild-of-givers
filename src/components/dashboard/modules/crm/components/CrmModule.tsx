import { useCrmSummary } from "../hooks/use-crm-summary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ListTodo, MessageSquare, Clock, Users } from "lucide-react";
import { SupporterIntelligence } from "./SupporterIntelligence";

export function CrmModule({ organizationId }: { organizationId?: string }) {
  const { data, isLoading } = useCrmSummary();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Active Leads</CardTitle>
            <ListTodo className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{(data?.stages['Visitor'] || 0) + (data?.stages['Registered User'] || 0)}</div>
            <p className="text-xs text-muted-foreground mt-1">Acquisition funnel</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Supporters</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.stages['Supporter'] || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified financial contributors</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">CRM Notes</CardTitle>
            <MessageSquare className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.notesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Internal notes recorded</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40 shadow-sm overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Recent Activity</CardTitle>
            <Clock className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            {data?.recentActivity.map((activity: any) => (
              <div key={activity.id} className="text-xs border-l-2 border-indigo-600/20 pl-3 py-1">
                <p className="font-bold text-indigo-600 capitalize">{activity.event_type.replace(/_/g, ' ')}</p>
                <p className="text-muted-foreground mt-0.5 truncate">
                  {activity.profiles?.full_name || 'Anonymous'}
                </p>
              </div>
            ))}
            {(!data?.recentActivity || data.recentActivity.length === 0) && (
              <p className="text-xs text-muted-foreground">No recent activity.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {organizationId && <SupporterIntelligence organizationId={organizationId} />}
    </div>
  );
}
