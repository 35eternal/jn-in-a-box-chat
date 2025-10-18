import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';

interface StarterQuestionsProps {
  onQuestionClick: (question: string) => void;
}

const DEFAULT_QUESTIONS = [
  "Create a workout plan for beginners",
  "What should I eat to build muscle?",
  "How do I lose weight safely?",
  "Design a home workout routine",
  "What supplements should I take?",
  "How can I improve my form?",
];

export const StarterQuestions = ({ onQuestionClick }: StarterQuestionsProps) => {
  // Show 4 random questions from the default list
  const getRandomQuestions = () => {
    const shuffled = [...DEFAULT_QUESTIONS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  const displayedQuestions = getRandomQuestions();

  return (
    <div className="w-full max-w-3xl mx-auto px-4">
      <div className="mb-4 text-center">
        <p className="text-white/60 text-sm">Try asking:</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {displayedQuestions.map((question, index) => (
          <Button
            key={index}
            variant="outline"
            onClick={() => onQuestionClick(question)}
            className="h-auto py-4 px-5 bg-[hsl(174,30%,18%)] border-white/20 hover:bg-[hsl(174,30%,22%)] hover:border-white/30 text-white text-left justify-start transition-all"
          >
            <MessageSquare className="h-4 w-4 mr-3 flex-shrink-0 text-[hsl(153,60%,45%)]" />
            <span className="text-sm">{question}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};
