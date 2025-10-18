import { Card } from '@/components/ui/card';
import { Dumbbell, Target, Utensils, TrendingUp } from 'lucide-react';

export const ChatIntroCard = () => {
  return (
    <Card className="mb-6 bg-gradient-to-br from-[hsl(174,35%,20%)] to-[hsl(174,30%,18%)] border-white/10 p-6 md:p-8">
      <div className="text-center mb-6">
        <div className="text-5xl mb-4">🏋️</div>
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          HD Physique AI Coach
        </h1>
        <p className="text-white/70 text-sm md:text-base max-w-2xl mx-auto">
          Your personalized AI fitness coach trained on evidence-based training and nutrition principles
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-[hsl(174,25%,16%)] p-4 rounded-lg border border-white/10">
          <div className="flex items-start gap-3">
            <div className="bg-[hsl(153,60%,35%)] p-2 rounded-lg">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Custom Workout Plans</h3>
              <p className="text-white/60 text-sm">
                Tailored training programs based on your goals and equipment
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(174,25%,16%)] p-4 rounded-lg border border-white/10">
          <div className="flex items-start gap-3">
            <div className="bg-[hsl(153,60%,35%)] p-2 rounded-lg">
              <Utensils className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Nutrition Guidance</h3>
              <p className="text-white/60 text-sm">
                Meal plans and dietary advice for your specific needs
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(174,25%,16%)] p-4 rounded-lg border border-white/10">
          <div className="flex items-start gap-3">
            <div className="bg-[hsl(153,60%,35%)] p-2 rounded-lg">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Form Corrections</h3>
              <p className="text-white/60 text-sm">
                Expert technique tips to maximize results and prevent injury
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[hsl(174,25%,16%)] p-4 rounded-lg border border-white/10">
          <div className="flex items-start gap-3">
            <div className="bg-[hsl(153,60%,35%)] p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Progress Tracking</h3>
              <p className="text-white/60 text-sm">
                Monitor your journey and adjust your plan as you improve
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};
