import { Json } from '@/integrations/supabase/types';

/**
 * User metadata structure stored in users.user_metadata JSONB field
 */
export interface UserMetadata {
  has_completed_onboarding?: boolean;
  suggested_questions?: string[];
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications_enabled?: boolean;
  };
}

/**
 * Personalization data stored in chats.personalization JSONB field
 */
export interface PersonalizationData {
  fitnessLevel?: string;
  primaryGoals?: string[];
  availableEquipment?: string;
  workoutFrequency?: string;
  dietaryPreferences?: string[];
}

/**
 * Type guard to check if a value is UserMetadata
 */
export function isUserMetadata(value: unknown): value is UserMetadata {
  if (!value || typeof value !== 'object') return false;
  return true;
}

/**
 * Type guard to check if a value is PersonalizationData
 */
export function isPersonalizationData(value: unknown): value is PersonalizationData {
  if (!value || typeof value !== 'object') return false;
  return true;
}

/**
 * Helper to safely parse user metadata from database
 */
export function parseUserMetadata(data: Json | null): UserMetadata {
  if (!data || typeof data !== 'object') {
    return {};
  }
  return data as UserMetadata;
}

/**
 * Helper to safely parse personalization data from database
 */
export function parsePersonalizationData(data: Json | null): PersonalizationData {
  if (!data || typeof data !== 'object') {
    return {};
  }
  return data as PersonalizationData;
}
