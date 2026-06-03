import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { crmService } from "@/lib/crm/crm-service";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, Clock, AlertTriangle, User, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TaskModuleProps {
  organizationId: string;
}

export const TaskModule: React.FC<TaskModuleProps> = ({ organizationId }) => {
  const queryClient = useQueryClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["crm-tasks", organizationId],
    queryFn: () => crmService.getTasks({ organizationId }),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: string; status: string }) =>
      crmService.updateTaskStatus(taskId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-tasks", organizationId] });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Operational Tasks</h2>
          <p className="text-muted-foreground">Manage follow-ups and organization operations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            All Tasks
          </Button>
          <Button variant="outline" size="sm">
            My Tasks
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          <p>Loading tasks...</p>
        ) : tasks?.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p>No open tasks. Everything is up to date!</p>
            </CardContent>
          </Card>
        ) : (
          tasks?.map((task: any) => (
            <Card
              key={task.id}
              className={`border-l-4 ${
                task.priority === "urgent"
                  ? "border-l-red-500"
                  : task.priority === "high"
                    ? "border-l-orange-500"
                    : "border-l-slate-200"
              }`}
            >
              <CardContent className="p-4 flex items-start gap-4">
                <button
                  onClick={() =>
                    updateTaskMutation.mutate({
                      taskId: task.id,
                      status: task.status === "completed" ? "open" : "completed",
                    })
                  }
                  className="mt-1 transition-colors hover:text-primary"
                >
                  {task.status === "completed" ? (
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3
                      className={`font-semibold ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}
                    >
                      {task.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      {task.due_date && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {format(new Date(task.due_date), "MMM d, yyyy")}
                        </div>
                      )}
                      <Badge className={getPriorityColor(task.priority)} variant="outline">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                  )}
                  <div className="pt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    {(task.profile || task.lead) && (
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {task.profile?.full_name || task.lead?.full_name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      Created {format(new Date(task.created_at), "MMM d")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
