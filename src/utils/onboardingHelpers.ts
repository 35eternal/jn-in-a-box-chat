import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Force-complete onboarding for a user
 * Updates BOTH Auth metadata AND database for redundancy
 * Used when onboarding status wasn't saved properly
 */
export const forceCompleteOnboarding = async (userId: string) => {
  console.log('🔧 Forcing onboarding completion for user:', userId);
  
  try {
    // Update Supabase Auth user metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        has_completed_onboarding: true
      }
    });

    if (authError) {
      console.error('❌ Failed to update Auth metadata:', authError);
      toast.error('Failed to fix onboarding status');
      return false;
    }

    // Also update database users table for redundancy
    // @ts-ignore - user_metadata column exists but types are out of date
    const { error: dbError } = await supabase
      .from('users')
      .update({
        user_metadata: {
          has_completed_onboarding: true
        }
      } as any)
      .eq('id', userId);

    if (dbError) {
      console.warn('⚠️ Failed to update database metadata (non-critical):', dbError);
      // Don't fail - Auth metadata is primary source
    }

    console.log('✅ Onboarding status updated successfully');
    toast.success('Onboarding status fixed!');
    return true;
  } catch (err) {
    console.error('❌ Error updating onboarding:', err);
    toast.error('An error occurred');
    return false;
  }
};

/**
 * Reset onboarding - allows user to go through setup again
 * This is useful for updating preferences or re-learning the app
 */
export const resetOnboarding = async (userId: string) => {
  console.log('🔄 Resetting onboarding for user:', userId);
  
  try {
    // Clear onboarding completion flag from Auth
    const { error: authError } = await supabase.auth.updateUser({
      data: {
        has_completed_onboarding: false,
        personalization: {} // Clear personalization too
      }
    });

    if (authError) {
      console.error('❌ Failed to reset onboarding in Auth:', authError);
      toast.error('Failed to reset tutorial');
      return false;
    }

    // Also clear from database
    // @ts-ignore - user_metadata column exists but types are out of date
    const { error: dbError } = await supabase
      .from('users')
      .update({
        user_metadata: {
          has_completed_onboarding: false
        }
      } as any)
      .eq('id', userId);

    if (dbError) {
      console.warn('⚠️ Failed to reset database metadata (non-critical):', dbError);
    }

    console.log('✅ Onboarding reset successfully');
    toast.success('Tutorial reset! Reloading...');
    return true;
  } catch (err) {
    console.error('❌ Error resetting onboarding:', err);
    toast.error('An error occurred');
    return false;
  }
};

/**
 * Check if user has completed onboarding
 * Checks BOTH Auth metadata (primary) and database (fallback)
 */
export const checkOnboardingStatus = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    // Check Auth metadata first (primary source)
    const authCompleted = user.user_metadata?.has_completed_onboarding === true;
    
    if (authCompleted) {
      return true;
    }

    // Fallback: Check database
    const { data: dbUser } = await supabase
      .from('users')
      .select('user_metadata')
      .eq('id', user.id)
      .single();

    // @ts-ignore - user_metadata exists but types are out of date
    const dbCompleted = (dbUser as any)?.user_metadata?.has_completed_onboarding === true;
    
    return dbCompleted;
  } catch (err) {
    console.error('❌ Error checking onboarding status:', err);
    return false;
  }
};
