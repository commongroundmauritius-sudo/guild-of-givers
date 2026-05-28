import { supabase } from "@/integrations/supabase/client";

export type EmailTemplate =
  | 'welcome'
  | 'payment_confirmation'
  | 'subscription_confirmation'
  | 'initiative_update'
  | 'milestone_reached';

export const engagementService = {
  /**
   * Enqueue a transactional email intent
   */
  async enqueueEmail(params: {
    recipient: string;
    templateKey: EmailTemplate;
    payload: Record<string, any>;
  }) {
    const { error } = await supabase.from('email_queue' as any).insert({
      recipient: params.recipient,
      template_key: params.templateKey,
      payload: params.payload,
      status: 'pending'
    });

    if (error) {
      console.error('Failed to enqueue email:', error);
      throw error;
    }
  },

  /**
   * Create an in-app notification
   */
  async createNotification(params: {
    userId: string;
    type: string;
    entityId: string;
    actorId?: string;
    metadata?: Record<string, any>;
  }) {
    const { error } = await supabase.from('notifications' as any).insert({
      user_id: params.userId,
      type: params.type,
      entity_id: params.entityId,
      actor_id: params.actorId,
      metadata: params.metadata || {}
    });

    if (error) {
      console.error('Failed to create notification:', error);
      throw error;
    }
  },

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[]) {
    const { error } = await supabase
      .from('notifications' as any)
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds);

    if (error) {
      console.error('Failed to mark notifications as read:', error);
      throw error;
    }
  }
};
