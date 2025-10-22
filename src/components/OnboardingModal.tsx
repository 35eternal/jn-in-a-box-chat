import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, CheckCircle2 } from 'lucide-react';
import { PersonalizationData } from '@/services/chatService';

interface OnboardingModalProps {
  open: boolean;
  onComplete: (personalization: PersonalizationData) => void;
}

export const OnboardingModal = ({ open, onComplete }: OnboardingModalProps) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<PersonalizationData>({
    fitnessLevel: '',
    primaryGoals: [],
    availableEquipment: '',
    workoutFrequency: '',
    dietaryPreferences: [],
  });

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

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };

  const handleComplete = () => {
    onComplete(formData);
  };

  const isStepComplete = () => {
    return step === 4 || (step === 2 && formData.primaryGoals.length > 0);
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-2xl bg-gradient-to-b from-[hsl(174,40%,20%)] to-[hsl(174,35%,17%)] border-white/10"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="py-8 px-4 text-center">
            <div className="text-6xl mb-6">🏋️</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              Welcome to HD Physique!
            </h2>
            <p className="text-xl text-white/80 mb-3">
              Let's personalize your AI fitness coach
            </p>
            <p className="text-white/60 mb-8 max-w-md mx-auto">
              HD Physique is your evidence-based AI fitness coach. We'll help you reach your goals with personalized workout plans, nutrition guidance, and expert advice.
            </p>
            <Button
              onClick={handleNext}
              className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white px-8 py-6 text-lg"
            >
              Get Started
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Step 2: Basic Personalization */}
        {step === 2 && (
          <div className="py-6 px-4">
            <h2 className="text-2xl font-bold text-white mb-2">Tell us about yourself</h2>
            <p className="text-white/60 mb-6">This helps us give you better advice</p>

            <div className="space-y-5 max-h-[400px] overflow-y-auto pr-2">
              {/* Fitness Level */}
              <div className="space-y-2">
                <Label className="text-white font-semibold">Fitness Level</Label>
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
              <div className="space-y-2">
                <Label className="text-white font-semibold">Primary Goals</Label>
                <p className="text-xs text-white/50">Select all that apply</p>
                <div className="space-y-2">
                  {[
                    { id: 'weight-loss', label: 'Weight Loss' },
                    { id: 'muscle-gain', label: 'Muscle Gain' },
                    { id: 'strength', label: 'Strength Training' },
                    { id: 'general-health', label: 'General Health' },
                  ].map((goal) => (
                    <div key={goal.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={goal.id}
                        checked={(formData.primaryGoals || []).includes(goal.id)}
                        onCheckedChange={() => handleGoalToggle(goal.id)}
                        className="border-white/30 data-[state=checked]:bg-[hsl(153,60%,35%)]"
                      />
                      <label htmlFor={goal.id} className="text-sm text-white cursor-pointer">
                        {goal.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Available Equipment */}
              <div className="space-y-2">
                <Label className="text-white font-semibold">Available Equipment</Label>
                <Select
                  value={formData.availableEquipment}
                  onValueChange={(value) => setFormData({ ...formData, availableEquipment: value })}
                >
                  <SelectTrigger className="bg-[hsl(174,30%,18%)] border-white/20 text-white">
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(174,30%,20%)] border-white/20">
                    <SelectItem value="none">No Equipment (Bodyweight)</SelectItem>
                    <SelectItem value="minimal">Minimal (Dumbbells, Bands)</SelectItem>
                    <SelectItem value="home-gym">Home Gym</SelectItem>
                    <SelectItem value="full-gym">Full Gym Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Workout Frequency */}
              <div className="space-y-2">
                <Label className="text-white font-semibold">Workout Frequency</Label>
                <Select
                  value={formData.workoutFrequency}
                  onValueChange={(value) => setFormData({ ...formData, workoutFrequency: value })}
                >
                  <SelectTrigger className="bg-[hsl(174,30%,18%)] border-white/20 text-white">
                    <SelectValue placeholder="How often?" />
                  </SelectTrigger>
                  <SelectContent className="bg-[hsl(174,30%,20%)] border-white/20">
                    <SelectItem value="1-2">1-2 times/week</SelectItem>
                    <SelectItem value="3-4">3-4 times/week</SelectItem>
                    <SelectItem value="5-6">5-6 times/week</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dietary Preferences */}
              <div className="space-y-2">
                <Label className="text-white font-semibold">Dietary Preferences</Label>
                <p className="text-xs text-white/50">Select all that apply</p>
                <div className="space-y-2">
                  {[
                    { id: 'no-restrictions', label: 'No Restrictions' },
                    { id: 'vegetarian', label: 'Vegetarian' },
                    { id: 'vegan', label: 'Vegan' },
                    { id: 'keto', label: 'Ketogenic' },
                  ].map((pref) => (
                    <div key={pref.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={pref.id}
                        checked={(formData.dietaryPreferences || []).includes(pref.id)}
                        onCheckedChange={() => handleDietaryToggle(pref.id)}
                        className="border-white/30 data-[state=checked]:bg-[hsl(153,60%,35%)]"
                      />
                      <label htmlFor={pref.id} className="text-sm text-white cursor-pointer">
                        {pref.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white"
              >
                Continue
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Explain Per-Chat Personalization */}
        {step === 3 && (
          <div className="py-8 px-4">
            <div className="text-center mb-6">
              <div className="text-5xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Each Chat Has Its Own Personality
              </h2>
            </div>

            <div className="bg-[hsl(174,30%,18%)] p-6 rounded-lg border border-white/10 mb-6">
              <p className="text-white/90 mb-4">
                You can customize each conversation with different goals and preferences.
              </p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(153,60%,45%)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold">Multiple Chat Profiles</p>
                    <p className="text-white/60">Create a "Weight Loss Chat" and a "Strength Training Chat" with different settings</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(153,60%,45%)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold">Tailored Advice</p>
                    <p className="text-white/60">Get specific recommendations based on each chat's goals</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[hsl(153,60%,45%)] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-white font-semibold">Easy to Update</p>
                    <p className="text-white/60">Change personalization anytime from the sidebar</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white"
              >
                Got It!
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Completion */}
        {step === 4 && (
          <div className="py-8 px-4 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-4">
              You're all set!
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Let's start your fitness journey
            </p>
            <Button
              onClick={handleComplete}
              className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white px-8 py-6 text-lg"
            >
              Start Chatting
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        )}

        {/* Progress Indicator */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 w-2 rounded-full transition-all ${
                s === step
                  ? 'bg-[hsl(153,60%,45%)] w-8'
                  : s < step
                  ? 'bg-[hsl(153,60%,45%)]'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
