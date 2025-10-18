// User metadata type definitions for HD Physique

export interface UserMetadata {
  has_completed_onboarding?: boolean;
  suggested_questions?: string[];
}

export interface FitnessPersonalizationData {
  fitnessLevel?: string;
  primaryGoals?: string[];
  availableEquipment?: string;
  workoutFrequency?: string;
  dietaryPreferences?: string[];
}
