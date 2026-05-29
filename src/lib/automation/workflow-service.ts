import { supabase } from "@/integrations/supabase/client";
import { automationService } from "./automation-service";
import { communicationDispatcher } from "@/lib/communication/dispatcher";

export interface WorkflowStep {
  id: string;
  templateKey: any;
  delayDays: number;
}

export const workflowService = {
  /**
   * Start a multi-step workflow for a user
   */
  async startWorkflow(workflowName: string, userId: string, payload: any = {}) {
    const workflows: Record<string, WorkflowStep[]> = {
      'welcome_series': [
        { id: 'welcome_1', templateKey: 'welcome', delayDays: 0 },
        { id: 'welcome_2', templateKey: 'milestone_reached', delayDays: 2 } // Example follow up
      ],
      'payment_recovery': [
        { id: 'recovery_1', templateKey: 'payment_confirmation', delayDays: 0 }, // Using existing templates as placeholders
      ]
    };

    const steps = workflows[workflowName];
    if (!steps) {
      console.warn(`Workflow ${workflowName} not found`);
      return;
    }

    for (const step of steps) {
      if (step.delayDays === 0) {
        await this.executeStep(step, userId, payload);
      } else {
        await this.scheduleStep(step, userId, payload);
      }
    }
  },

  async executeStep(step: WorkflowStep, userId: string, payload: any) {
    const { data: profile } = await supabase.from('profiles').select('email').eq('id', userId).single();

    await communicationDispatcher.dispatch({
      userId,
      channels: ['email', 'in_app'],
      templateKey: step.templateKey,
      payload: { ...payload, step_id: step.id },
      recipientEmail: profile?.email ?? undefined
    });
  },

  async scheduleStep(step: WorkflowStep, userId: string, payload: any) {
    // In a real system, this would use a background task or a 'delayed_jobs' table.
    // For our foundation, we'll create a CRM task as a 'reminder' to execute or use automation_rules.

    await supabase.from('automation_executions' as any).insert({
      user_id: userId,
      entity_id: payload.initiative_id,
      status: 'pending',
      result: {
        scheduled_step: step,
        payload,
        execute_after: new Date(Date.now() + step.delayDays * 86400000).toISOString()
      }
    });
  }
};
