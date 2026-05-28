import { useFinancialTrace } from "../hooks/use-financial-trace";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export function FinancialTraceTable() {
  const { data: trace, isLoading } = useFinancialTrace();

  if (isLoading) {
    return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;
  }

  return (
    <Card className="rounded-3xl border-border/40 mt-8">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Financial Traceability</CardTitle>
        <p className="text-sm text-muted-foreground">Detailed flow of every contribution from payment to allocation.</p>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Contributor</TableHead>
                <TableHead className="text-right">Gross</TableHead>
                <TableHead className="text-right">Fee</TableHead>
                <TableHead className="text-right">Platform (20%)</TableHead>
                <TableHead>Allocations</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trace?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No transactions found.
                  </TableCell>
                </TableRow>
              ) : (
                trace?.map((row) => (
                  <TableRow key={row.paymentId}>
                    <TableCell className="font-medium">
                      {format(new Date(row.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell>{row.userName}</TableCell>
                    <TableCell className="text-right font-semibold">Rs {row.grossAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-muted-foreground">Rs {row.feeAmount.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-amber-600">Rs {row.platformAmount.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {row.allocations.map((alloc, idx) => (
                          <div key={idx} className="flex justify-between gap-4 text-xs">
                            <span className="text-muted-foreground truncate max-w-[150px]">
                              {alloc.initiativeName}
                              {alloc.type === 'impact_pool' && " (Impact Pool)"}
                            </span>
                            <span className="font-medium text-emerald-600">
                              Rs {alloc.amount.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
