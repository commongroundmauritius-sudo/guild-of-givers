import { useAcquisitionMetrics } from "../hooks/use-acquisition-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, UserPlus, CreditCard, Heart } from "lucide-react";

export function SupporterJourney() {
  const { data, isLoading } = useAcquisitionMetrics();

  if (isLoading) return <div className="h-64 animate-pulse bg-muted rounded-3xl" />;

  const subsCount = data?.campaignLinks?.reduce((acc: number, curr: any) => acc + (Number(curr.conversions || 0)), 0) || 0;

  const steps = [
    { label: "Visits", value: data?.visits || 0, icon: <ArrowRight className="h-4 w-4" />, color: "bg-blue-500" },
    { label: "Registrations", value: data?.registrations || 0, icon: <UserPlus className="h-4 w-4" />, color: "bg-indigo-500" },
    { label: "Subscriptions", value: subsCount, icon: <CreditCard className="h-4 w-4" />, color: "bg-violet-500" },
    { label: "Ambassadors", value: 0, icon: <Heart className="h-4 w-4" />, color: "bg-pink-500" },
  ];

  return (
    <Card className="rounded-3xl border-border/40 overflow-hidden">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Aggregate Supporter Journey</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 md:gap-2">
          {steps?.map((step, idx) => (
            <div key={step.label} className="flex-1 w-full relative">
              <div className="flex flex-col items-center text-center space-y-2">
                <div className={`p-3 rounded-2xl ${step.color} text-white shadow-lg`}>
                  {step.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold">{Number(step.value || 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{step.label}</p>
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div className="hidden md:block absolute top-6 -right-4 translate-x-1/2">
                  <ArrowRight className="h-4 w-4 text-muted-foreground/30" />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 border-t pt-6">
          <ConversionStat
            label="Visit to Reg"
            value={data?.visits ? ((data.registrations / data.visits) * 100).toFixed(1) : 0}
          />
          <ConversionStat
            label="Reg to Sub"
            value={data?.registrations ? ((subsCount / data.registrations) * 100).toFixed(1) : 0}
          />
          <ConversionStat
            label="Overall"
            value={data?.visits ? ((subsCount / data.visits) * 100).toFixed(1) : 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function ConversionStat({ label, value }: { label: string, value: string | number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold">{value}%</p>
      <p className="text-[10px] text-muted-foreground uppercase font-medium">{label}</p>
    </div>
  );
}
