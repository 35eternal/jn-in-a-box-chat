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

export interface ServiceResponse<T = null> {
  success: boolean;
  data?: T;
  error?: {
    type: 'timeout' | 'validation' | 'RLS' | 'network' | 'unknown';
    message: string;
    code?: string;
  };
}

function classifyError(error: unknown, operation: string): ServiceResponse['error'] {
  if (error instanceof Error && error.message.includes('timed out')) {
    return { type: 'timeout', message: `Operation ${operation} timed out. Check your connection.` };
  }
  if (error instanceof Error && error.message.includes('23505')) {
    return { type: 'validation', message: 'Duplicate entry. Webhook name or URL already exists.' };
  }
  const err = error as any;
  if (err.code === '42501') {
    return { type: 'RLS', message: 'Permission denied. Admin access required.' };
  }
  if (err.message?.includes('network') || err.name === 'TypeError') {
    return { type: 'network', message: 'Network error. Please try again.' };
  }
  return {
    type: 'unknown',
    message: `Failed to ${operation}: ${err.message || 'Unknown error'}`,
    code: err.code
  };
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
): Promise<ServiceResponse<Webhook>> {
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
      const classified = classifyError(error, 'add webhook');
      console.error('[WebhookService] Supabase error adding webhook:', classified);
      return { success: false, error: classified };
    }

    if (!data) {
      return { success: false, error: { type: 'unknown', message: 'No data returned after adding webhook' } };
    }

    return { success: true, data };
  } catch (error) {
    const classified = classifyError(error, 'add webhook');
    console.error('[WebhookService] Error adding webhook:', classified);
    return { success: false, error: classified };
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
): Promise<ServiceResponse<Webhook>> {
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
      const classified = classifyError(error, 'update webhook');
      console.error('[WebhookService] Supabase error updating webhook:', classified);
      return { success: false, error: classified };
    }

    if (!updatedData) {
      return { success: false, error: { type: 'unknown', message: 'No data returned after updating webhook' } };
    }

    return { success: true, data: updatedData };
  } catch (error) {
    const classified = classifyError(error, 'update webhook');
    console.error('[WebhookService] Error updating webhook:', classified);
    return { success: false, error: classified };
  }
}

/**
 * Delete a webhook
 * @param id - Webhook ID
 */
export async function deleteWebhook(id: string): Promise<ServiceResponse<null>> {
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
      const classified = classifyError(error, 'delete webhook');
      console.error('[WebhookService] Supabase error deleting webhook:', classified);
      return { success: false, error: classified };
    }

    return { success: true };
  } catch (error) {
    const classified = classifyError(error, 'delete webhook');
    console.error('[WebhookService] Error deleting webhook:', classified);
    return { success: false, error: classified };
  }
}

/**
 * Toggle the is_active status of a webhook
 * @param id - Webhook ID
 */
export async function toggleWebhookActive(id: string): Promise<ServiceResponse<Webhook>> {
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
      const classified = classifyError(fetchError, 'fetch webhook for toggle');
      console.error('[WebhookService] Supabase error fetching webhook:', classified);
      return { success: false, error: classified };
    }

    currentWebhook = data;
    if (!currentWebhook) {
      return { success: false, error: { type: 'unknown', message: 'Webhook not found' } };
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
      const classified = classifyError(updateError, 'toggle webhook');
      console.error('[WebhookService] Supabase error toggling webhook active status:', classified);
      return { success: false, error: classified };
    }

    if (!updatedData) {
      return { success: false, error: { type: 'unknown', message: 'No data returned after toggling webhook' } };
    }

    return { success: true, data: updatedData };
  } catch (error) {
    const classified = classifyError(error, 'toggle webhook');
    console.error('[WebhookService] Error toggling webhook active status:', classified);
    return { success: false, error: classified };
  }
}
