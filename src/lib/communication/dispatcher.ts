import { engagementService, EmailTemplate } from "@/lib/engagement-service";

export type CommunicationChannel = "email" | "in_app" | "sms" | "whatsapp";

export interface DispatchParams {
  userId: string;
  channels: CommunicationChannel[];
  templateKey: EmailTemplate;
  payload: Record<string, any>;
  recipientEmail?: string;
  metadata?: Record<string, any>;
}

/**
 * Channel-agnostic communication dispatcher
 */
export const communicationDispatcher = {
  async dispatch(params: DispatchParams) {
    const { userId, channels, templateKey, payload, recipientEmail, metadata = {} } = params;
    const results: Array<
      { channel?: CommunicationChannel; status?: string; error?: string } | undefined
    > = [];

    for (const channel of channels) {
      try {
        let result;
        switch (channel) {
          case "email":
            result = await this.sendEmail(recipientEmail, templateKey, payload);
            break;
          case "in_app":
            result = await this.sendInAppNotification(userId, templateKey, payload, metadata);
            break;
          case "sms":
          case "whatsapp":
            // Abstraction for future implementation
            console.log(`Channel ${channel} not yet implemented, but abstracted.`);
            result = { channel, status: "deferred" };
            break;
          default:
            console.warn(`Unknown communication channel: ${channel}`);
        }
        results.push(result);
      } catch (err: any) {
        console.error(`Failed to dispatch to channel ${channel}:`, err);
        results.push({ channel, status: "failed", error: err.message });
      }
    }

    return results;
  },

  async sendEmail(recipient: string | undefined, templateKey: EmailTemplate, payload: any) {
    if (!recipient) throw new Error("Recipient email is required for email channel");
    await engagementService.enqueueEmail({
      recipient,
      templateKey,
      payload,
    });
    return { channel: "email", status: "queued" };
  },

  async sendInAppNotification(userId: string, type: string, payload: any, metadata: any) {
    await engagementService.createNotification({
      userId,
      type,
      entityId: payload.entityId || payload.initiative_id,
      metadata: { ...payload, ...metadata },
    });
    return { channel: "in_app", status: "sent" };
  },
};
