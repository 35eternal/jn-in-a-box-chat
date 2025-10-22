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
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Add timed out after 10s')), 10000)
  );

  try {
    const promise = supabase
      .from('webhooks')
      .insert({
        name,
        url,
        priority,
        is_active: true,
      })
      .select()
      .single();

    const { data, error } = await Promise.race([promise, timeoutPromise]);

    if (error) {
      console.error('[WebhookService] Supabase error adding webhook:', error);
      throw new Error(`Failed to add webhook: ${error.message}`);
    }

    if (!data) {
      throw new Error('No data returned after adding webhook');
    }

    return data;
  } catch (error) {
    if (error.message.includes('timed out')) {
      console.error('[WebhookService] Webhook add timed out after 10s');
    } else {
      console.error('[WebhookService] Error adding webhook:', error);
    }
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
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Update timed out after 10s')), 10000)
  );

  try {
    const promise = supabase
      .from('webhooks')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    const { data: updatedData, error } = await Promise.race([promise, timeoutPromise]);

    if (error) {
      console.error('[WebhookService] Supabase error updating webhook:', error);
      throw new Error(`Failed to update webhook: ${error.message}`);
    }

    if (!updatedData) {
      throw new Error('No data returned after updating webhook');
    }

    return updatedData;
  } catch (error) {
    if (error.message.includes('timed out')) {
      console.error('[WebhookService] Webhook update timed out after 10s');
    } else {
      console.error('[WebhookService] Error updating webhook:', error);
    }
    throw error;
  }
}

/**
 * Delete a webhook
 * @param id - Webhook ID
 */
export async function deleteWebhook(id: string): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Delete timed out after 10s')), 10000)
  );

  try {
    const promise = supabase
      .from('webhooks')
      .delete()
      .eq('id', id);

    const { error } = await Promise.race([promise, timeoutPromise]);

    if (error) {
      console.error('[WebhookService] Supabase error deleting webhook:', error);
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  } catch (error) {
    if (error.message.includes('timed out')) {
      console.error('[WebhookService] Webhook delete timed out after 10s');
    } else {
      console.error('[WebhookService] Error deleting webhook:', error);
    }
    throw error;
  }
}

/**
 * Toggle the is_active status of a webhook
 * @param id - Webhook ID
 */
export async function toggleWebhookActive(id: string): Promise<Webhook> {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Toggle timed out after 10s')), 10000)
  );

  let currentWebhook;

  try {
    // First, fetch the current webhook to get its active status
    const fetchPromise = supabase
      .from('webhooks')
      .select('is_active')
      .eq('id', id)
      .single();

    const fetchResult = await Promise.race([fetchPromise, timeoutPromise]);
    const { data, error: fetchError } = fetchResult;

    if (fetchError) {
      console.error('[WebhookService] Supabase error fetching webhook:', fetchError);
      throw new Error(`Failed to fetch webhook: ${fetchError.message}`);
    }

    currentWebhook = data;
    if (!currentWebhook) {
      throw new Error('Webhook not found');
    }

    // Toggle the is_active status
    const updatePromise = supabase
      .from('webhooks')
      .update({ is_active: !currentWebhook.is_active })
      .eq('id', id)
      .select()
      .single();

    const updateResult = await Promise.race([updatePromise, timeoutPromise]);
    const { data: updatedData, error: updateError } = updateResult;

    if (updateError) {
      console.error('[WebhookService] Supabase error toggling webhook active status:', updateError);
      throw new Error(`Failed to toggle webhook active status: ${updateError.message}`);
    }

    if (!updatedData) {
      throw new Error('No data returned after toggling webhook');
    }

    return updatedData;
  } catch (error) {
    if (error.message.includes('timed out')) {
      console.error('[WebhookService] Webhook toggle timed out after 10s');
    } else {
      console.error('[WebhookService] Error toggling webhook active status:', error);
    }
    throw error;
  }
}
