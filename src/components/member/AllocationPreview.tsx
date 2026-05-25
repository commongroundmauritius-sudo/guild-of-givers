import { useAllocationSimulation } from "@/hooks/use-allocation-simulation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface AllocationPreviewProps {
  amount: number;
  userId?: string;
}

export function AllocationPreview({ amount, userId }: AllocationPreviewProps) {
  const { data: simulation, isLoading } = useAllocationSimulation(amount, userId);

  if (isLoading) return <Skeleton className="h-48 w-full rounded-3xl" />;
  if (!simulation) return null;

  return (
    <Card className="rounded-3xl border-teal-600/20 bg-card overflow-hidden">
      <CardHeader className="bg-teal-600/5 pb-4">
        <CardTitle className="text-lg font-display text-teal-700 flex justify-between items-center">
          Next Allocation Preview
          <Badge variant="outline" className="text-teal-600 border-teal-600/20">
            Estimated
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground font-medium">Net Contribution</p>
            <p className="text-lg font-bold text-primary">Rs {simulation.netAmount.toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-muted-foreground font-medium">Processing Fee</p>
            <p className="text-lg font-bold text-muted-foreground">Rs {simulation.feeAmount.toLocaleString()}</p>
          </div>
        </div>

        <div className="space-y-3 pt-4 border-t border-border/40">
          <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Projected Distribution</p>
          {simulation.allocations.map((a) => (
            <div key={a.initiativeId} className="flex justify-between items-center">
              <span className="text-sm font-medium">{a.title}</span>
              <span className="text-sm font-bold text-teal-600">Rs {a.amount.toLocaleString()}</span>
            </div>
          ))}
          {simulation.impactPoolAmount > 0 && (
            <div className="flex justify-between items-center italic">
              <span className="text-sm font-medium">Impact Pool (Fallback)</span>
              <span className="text-sm font-bold text-amber-600">Rs {simulation.impactPoolAmount.toLocaleString()}</span>
            </div>
          )}
        </div>

        <div className="pt-4 border-t border-border/40 text-[10px] text-muted-foreground italic text-center">
          CommonGround retains 20% (Rs {simulation.platformShare.toLocaleString()}) of net contribution for platform sustainability.
        </div>
      </CardContent>
    </Card>
  );
}
