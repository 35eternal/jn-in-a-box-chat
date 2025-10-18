import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { PersonalizationData, updatePersonalization } from '@/services/chatService';

interface PersonalizationModalProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  currentPersonalization?: PersonalizationData;
}

export const PersonalizationModal = ({
  open,
  onClose,
  chatId,
  currentPersonalization,
}: PersonalizationModalProps) => {
  const [formData, setFormData] = useState<PersonalizationData>({
    fitnessLevel: '',
    primaryGoals: [],
    availableEquipment: '',
    workoutFrequency: '',
    dietaryPreferences: [],
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (currentPersonalization) {
      setFormData(currentPersonalization);
    }
  }, [currentPersonalization]);

  const handleGoalToggle = (goal: string) => {
    const currentGoals = formData.primaryGoals || [];
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter((g) => g !== goal)
      : [...currentGoals, goal];
    setFormData({ ...formData, primaryGoals: newGoals });
  };

  const handleDietaryToggle = (preference: string) => {
    const currentPreferences = formData.dietaryPreferences || [];
    const newPreferences = currentPreferences.includes(preference)
      ? currentPreferences.filter((p) => p !== preference)
      : [...currentPreferences, preference];
    setFormData({ ...formData, dietaryPreferences: newPreferences });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const success = await updatePersonalization(chatId, formData);
      if (success) {
        toast({
          title: 'Success',
          description: 'Personalization settings saved successfully',
        });
        onClose();
      } else {
        throw new Error('Failed to save personalization');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save personalization settings',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-b from-[hsl(174,40%,20%)] to-[hsl(174,35%,17%)] border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Personalize Your Fitness Coach</DialogTitle>
          <DialogDescription className="text-white/70">
            Customize this chat to get personalized fitness and nutrition advice
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Fitness Level */}
          <div className="space-y-2">
            <Label htmlFor="fitnessLevel" className="text-white font-semibold">
              Fitness Level
            </Label>
            <Select
              value={formData.fitnessLevel}
              onValueChange={(value) => setFormData({ ...formData, fitnessLevel: value })}
            >
              <SelectTrigger className="bg-[hsl(174,30%,18%)] border-white/20 text-white">
                <SelectValue placeholder="Select your fitness level" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(174,30%,20%)] border-white/20">
                <SelectItem value="beginner">Beginner (0-1 year)</SelectItem>
                <SelectItem value="intermediate">Intermediate (1-3 years)</SelectItem>
                <SelectItem value="advanced">Advanced (3+ years)</SelectItem>
                <SelectItem value="athlete">Competitive Athlete</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Primary Goals */}
          <div className="space-y-3">
            <Label className="text-white font-semibold">Primary Goals</Label>
            <p className="text-sm text-white/60">Select all that apply</p>
            <div className="space-y-3">
              {[
                { id: 'weight-loss', label: 'Weight Loss / Fat Loss' },
                { id: 'muscle-gain', label: 'Muscle Gain / Hypertrophy' },
                { id: 'strength', label: 'Strength Training' },
                { id: 'athletic', label: 'Athletic Performance' },
                { id: 'endurance', label: 'Endurance / Cardio' },
                { id: 'general-health', label: 'General Health & Wellness' },
                { id: 'mobility', label: 'Flexibility & Mobility' },
              ].map((goal) => (
                <div key={goal.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={goal.id}
                    checked={(formData.primaryGoals || []).includes(goal.id)}
                    onCheckedChange={() => handleGoalToggle(goal.id)}
                    className="border-white/30 data-[state=checked]:bg-[hsl(153,60%,35%)] data-[state=checked]:border-[hsl(153,60%,35%)]"
                  />
                  <label
                    htmlFor={goal.id}
                    className="text-sm text-white cursor-pointer"
                  >
                    {goal.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Available Equipment */}
          <div className="space-y-2">
            <Label htmlFor="availableEquipment" className="text-white font-semibold">
              Available Equipment
            </Label>
            <Select
              value={formData.availableEquipment}
              onValueChange={(value) => setFormData({ ...formData, availableEquipment: value })}
            >
              <SelectTrigger className="bg-[hsl(174,30%,18%)] border-white/20 text-white">
                <SelectValue placeholder="Select available equipment" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(174,30%,20%)] border-white/20">
                <SelectItem value="none">No Equipment (Bodyweight Only)</SelectItem>
                <SelectItem value="minimal">Minimal (Dumbbells, Resistance Bands)</SelectItem>
                <SelectItem value="home-gym">Home Gym (Barbell, Rack, Bench)</SelectItem>
                <SelectItem value="full-gym">Full Gym Access</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Workout Frequency */}
          <div className="space-y-2">
            <Label htmlFor="workoutFrequency" className="text-white font-semibold">
              Workout Frequency
            </Label>
            <Select
              value={formData.workoutFrequency}
              onValueChange={(value) => setFormData({ ...formData, workoutFrequency: value })}
            >
              <SelectTrigger className="bg-[hsl(174,30%,18%)] border-white/20 text-white">
                <SelectValue placeholder="How often do you work out?" />
              </SelectTrigger>
              <SelectContent className="bg-[hsl(174,30%,20%)] border-white/20">
                <SelectItem value="1-2">1-2 times per week</SelectItem>
                <SelectItem value="3-4">3-4 times per week</SelectItem>
                <SelectItem value="5-6">5-6 times per week</SelectItem>
                <SelectItem value="daily">Daily (7+ times per week)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Dietary Preferences */}
          <div className="space-y-3">
            <Label className="text-white font-semibold">Dietary Preferences</Label>
            <p className="text-sm text-white/60">Select all that apply</p>
            <div className="space-y-3">
              {[
                { id: 'no-restrictions', label: 'No Dietary Restrictions' },
                { id: 'vegetarian', label: 'Vegetarian' },
                { id: 'vegan', label: 'Vegan' },
                { id: 'pescatarian', label: 'Pescatarian' },
                { id: 'keto', label: 'Ketogenic' },
                { id: 'paleo', label: 'Paleo' },
                { id: 'gluten-free', label: 'Gluten-Free' },
                { id: 'dairy-free', label: 'Dairy-Free' },
                { id: 'halal', label: 'Halal' },
                { id: 'kosher', label: 'Kosher' },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={pref.id}
                    checked={(formData.dietaryPreferences || []).includes(pref.id)}
                    onCheckedChange={() => handleDietaryToggle(pref.id)}
                    className="border-white/30 data-[state=checked]:bg-[hsl(153,60%,35%)] data-[state=checked]:border-[hsl(153,60%,35%)]"
                  />
                  <label
                    htmlFor={pref.id}
                    className="text-sm text-white cursor-pointer"
                  >
                    {pref.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white"
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
