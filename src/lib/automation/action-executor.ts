import { supabase } from "@/integrations/supabase/client";
import { engagementService } from "@/lib/engagement-service";
import { supporterService, LifecycleStage } from "@/lib/crm/supporter-service";

export interface AutomationAction {
  type: string;
  config: any;
}

export const actionExecutor = {
  async execute(
    action: AutomationAction,
    payload: any,
    logFn: (level: string, message: string) => Promise<void>,
  ) {
    await logFn("info", `Executing action: ${action.type}`);

    switch (action.type) {
      case "send_email":
        return await this.sendEmail(action.config, payload);

      case "create_notification":
        return await this.createNotification(action.config, payload);

      case "update_lifecycle_stage":
        return await this.updateLifecycleStage(action.config, payload);

      case "create_task":
        return await this.createTask(action.config, payload);

      case "add_tag":
        return await this.addTag(action.config, payload);

      default:
        await logFn("warning", `Unknown action type: ${action.type}`);
        return { type: action.type, status: "unknown" };
    }
  },

  async sendEmail(config: any, payload: any) {
    const recipient = payload.email || (await this.getUserEmail(payload.user_id));
    if (!recipient) throw new Error("No recipient email found");

    await engagementService.enqueueEmail({
      recipient,
      templateKey: config.template,
      payload: { ...payload, ...config.payload },
    });
    return { type: "send_email", status: "success" };
  },

  async createNotification(config: any, payload: any) {
    await engagementService.createNotification({
      userId: payload.user_id,
      type: config.type,
      entityId: payload.entity_id || payload.initiative_id,
      metadata: config.metadata,
    });
    return { type: "create_notification", status: "success" };
  },

  async updateLifecycleStage(config: any, payload: any) {
    if (payload.user_id) {
      await supporterService.transitionStage(payload.user_id, config.stage as LifecycleStage);
      return { type: "update_lifecycle_stage", status: "success" };
    }
    return { type: "update_lifecycle_stage", status: "skipped", reason: "No user_id" };
  },

  async createTask(config: any, payload: any) {
    await supabase.from("crm_tasks" as any).insert({
      organization_id: payload.organization_id,
      profile_id: payload.user_id,
      title: config.title,
      description: config.description,
      priority: config.priority || "medium",
      due_date: config.delay_days
        ? new Date(Date.now() + config.delay_days * 86400000).toISOString()
        : null,
    });
    return { type: "create_task", status: "success" };
  },

  async addTag(config: any, payload: any) {
    // Requires crm_tag_assignments and crm_tags logic
    // Placeholder for tag implementation
    return { type: "add_tag", status: "deferred" };
  },

  async getUserEmail(userId: string) {
    if (!userId) return null;
    const { data } = await supabase.from("profiles").select("email").eq("id", userId).single();
    return data?.email;
  },
};
