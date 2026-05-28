import { useAcquisitionMetrics } from "../hooks/use-acquisition-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Globe, MousePointer2, BarChart3 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function AcquisitionModule() {
  const { data, isLoading } = useAcquisitionMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Visits</CardTitle>
            <Globe className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.visits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Unique page views tracked</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Registrations</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data?.registrations.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total member accounts</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-border/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Top Channel</CardTitle>
            <MousePointer2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold capitalize">{data?.topSources[0]?.name || "Direct"}</div>
            <p className="text-xs text-muted-foreground mt-1">{data?.topSources[0]?.count || 0} leads acquired</p>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-3xl border-border/40">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Top Campaign Links
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Visits</TableHead>
                <TableHead className="text-right">Conversions</TableHead>
                <TableHead className="text-right">Revenue (Rs)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.campaignLinks?.map((link) => (
                <TableRow key={link.id}>
                  <TableCell className="font-medium">{link.name}</TableCell>
                  <TableCell className="capitalize">{link.source}</TableCell>
                  <TableCell className="text-right">{link.visits.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{link.conversions.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{link.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {(!data?.campaignLinks || data.campaignLinks.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No campaign link data available yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
