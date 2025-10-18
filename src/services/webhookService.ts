import { supabase } from "@/integrations/supabase/client";

export interface Webhook {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

/**
 * Fetch all active webhooks ordered by priority (ascending)
 * Lower priority numbers are tried first
 */
export async function fetchActiveWebhooks(): Promise<Webhook[]> {
  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .eq('is_active', true)
      .order('priority', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch active webhooks: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[WebhookService] Error fetching active webhooks:', error);
    throw error;
  }
}

/**
 * Fetch all webhooks (active and inactive) for admin UI
 * Ordered by priority (ascending)
 */
export async function fetchAllWebhooks(): Promise<Webhook[]> {
  try {
    const { data, error } = await supabase
      .from('webhooks')
      .select('*')
      .order('priority', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch all webhooks: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('[WebhookService] Error fetching all webhooks:', error);
    throw error;
  }
}

/**
 * Add a new webhook
 * @param name - Display name for the webhook
 * @param url - Full webhook URL
 * @param priority - Priority order (default: 0, lower = higher priority)
 */
export async function addWebhook(
  name: string,
  url: string,
  priority: number = 0
): Promise<Webhook> {
  try {
    const { data, error } = await supabase
      .from('webhooks')
      .insert({
        name,
        url,
        priority,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to add webhook: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned after adding webhook');
    }

    return data;
  } catch (error) {
    console.error('[WebhookService] Error adding webhook:', error);
    throw error;
  }
}

/**
 * Update an existing webhook
 * @param id - Webhook ID
 * @param data - Partial webhook data to update
 */
export async function updateWebhook(
  id: string,
  data: Partial<Omit<Webhook, 'id' | 'created_at' | 'updated_at'>>
): Promise<Webhook> {
  try {
    const { data: updatedData, error } = await supabase
      .from('webhooks')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update webhook: ${error.message}`);
    }

    if (!updatedData) {
      throw new Error('No data returned after updating webhook');
    }

    return updatedData;
  } catch (error) {
    console.error('[WebhookService] Error updating webhook:', error);
    throw error;
  }
}

/**
 * Delete a webhook
 * @param id - Webhook ID
 */
export async function deleteWebhook(id: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('webhooks')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  } catch (error) {
    console.error('[WebhookService] Error deleting webhook:', error);
    throw error;
  }
}

/**
 * Toggle the is_active status of a webhook
 * @param id - Webhook ID
 */
export async function toggleWebhookActive(id: string): Promise<Webhook> {
  try {
    // First, fetch the current webhook to get its active status
    const { data: currentWebhook, error: fetchError } = await supabase
      .from('webhooks')
      .select('is_active')
      .eq('id', id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch webhook: ${fetchError.message}`);
    }

    if (!currentWebhook) {
      throw new Error('Webhook not found');
    }

    // Toggle the is_active status
    const { data: updatedData, error: updateError } = await supabase
      .from('webhooks')
      .update({ is_active: !currentWebhook.is_active })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to toggle webhook active status: ${updateError.message}`);
    }

    if (!updatedData) {
      throw new Error('No data returned after toggling webhook');
    }

    return updatedData;
  } catch (error) {
    console.error('[WebhookService] Error toggling webhook active status:', error);
    throw error;
  }
}
