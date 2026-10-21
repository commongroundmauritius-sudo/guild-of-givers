import { supabase } from "@/integrations/supabase/client";
import { triggerHandler } from "./trigger-handler";
import { actionExecutor, AutomationAction } from "./action-executor";

export const automationService = {
  /**
   * Main entry point for processing triggers
   */
  async processTrigger(triggerType: string, payload: any) {
    const { data: rules, error } = await supabase
      .from("automation_rules")
      .select("*")
      .eq("trigger_type", triggerType)
      .eq("is_active", true);

    if (error) {
      console.error("Failed to fetch automation rules:", error);
      return;
    }

    if (!rules) return;

    for (const rule of rules) {
      if (
        triggerHandler.matches(rule, payload) &&
        triggerHandler.evaluateConditions(rule, payload)
      ) {
        await this.executeRule(rule, payload);
      }
    }
  },

  /**
   * Execute the actions defined in a rule
   */
  async executeRule(rule: any, payload: any) {
    const { data: execution, error: execError } = await supabase
      .from("automation_executions")
      .insert({
        rule_id: rule.id,
        user_id: payload.user_id,
        entity_id: payload.entity_id || payload.initiative_id,
        status: "pending",
      })
      .select()
      .single();

    if (execError || !execution) {
      console.error("Failed to create automation execution:", execError);
      return;
    }

    try {
      const actions = rule.actions as AutomationAction[];
      const results: Array<{ type?: string; status?: string; [key: string]: any }> = [];

      const logFn = async (level: string, message: string) => {
        await supabase.from("automation_logs").insert({
          execution_id: execution.id,
          level,
          message,
        });
      };

      for (const action of actions) {
        const result = await actionExecutor.execute(action, payload, logFn);
        results.push(result);
      }

      await supabase
        .from("automation_executions")
        .update({ status: "completed", result: { actions: results } })
        .eq("id", execution.id);
    } catch (err: any) {
      console.error("Rule execution failed:", err);
      await supabase.from("automation_logs").insert({
        execution_id: execution.id,
        level: "error",
        message: err.message,
      });
      await supabase
        .from("automation_executions")
        .update({ status: "failed" })
        .eq("id", execution.id);
    }
  },
};
