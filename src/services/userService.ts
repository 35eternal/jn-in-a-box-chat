import { supabase } from '@/integrations/supabase/client';
import { UserMetadata, parseUserMetadata } from '@/types/database';
import { dbLogger } from '@/utils/logger';

// Get user metadata
export const getUserMetadata = async (userId: string): Promise<UserMetadata> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_metadata')
      .eq('id', userId)
      .single();

    if (error) {
      dbLogger.error('Failed to fetch user metadata', { userId, error });
      return {};
    }

    return parseUserMetadata(data?.user_metadata);
  } catch (error) {
    dbLogger.error('Exception fetching user metadata', error);
    return {};
  }
};

// Update user metadata
export const updateUserMetadata = async (
  userId: string,
  metadata: Partial<UserMetadata>
): Promise<boolean> => {
  try {
    // First get current metadata
    const currentMetadata = await getUserMetadata(userId);
    
    // Merge with new metadata
    const updatedMetadata = {
      ...currentMetadata,
      ...metadata,
    };

    const { error } = await supabase
      .from('users')
      .update({ user_metadata: updatedMetadata as any })
      .eq('id', userId);

    if (error) {
      dbLogger.error('Failed to update user metadata', { userId, error });
      return false;
    }

    dbLogger.info('User metadata updated', { userId });
    return true;
  } catch (error) {
    dbLogger.error('Exception updating user metadata', error);
    return false;
  }
};

// Mark onboarding as completed
export const completeOnboarding = async (userId: string): Promise<boolean> => {
  dbLogger.info('Completing onboarding', { userId });
  return updateUserMetadata(userId, { has_completed_onboarding: true });
};

// Check if user has completed onboarding
export const hasCompletedOnboarding = async (userId: string): Promise<boolean> => {
  const metadata = await getUserMetadata(userId);
  return metadata.has_completed_onboarding === true;
};
