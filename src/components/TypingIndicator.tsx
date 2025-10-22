import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  avatarUrl?: string;
}

export const TypingIndicator = ({ avatarUrl }: TypingIndicatorProps) => {
  return (
    <div className="flex gap-4 mb-8 animate-slide-in-left">
      {avatarUrl && (
        <Avatar className="h-12 w-12 shrink-0 flex-shrink-0 order-first sm:order-last">
          <AvatarImage src={avatarUrl} alt="AI Assistant" />
          <AvatarFallback className="bg-accent text-accent-foreground border border-accent/20">AI</AvatarFallback>
        </Avatar>
      )}
      
      <div className="bg-[hsl(var(--ai-message-bg))] px-5 py-4 rounded-bl-xl rounded-br-xl border border-accent/30 shadow-lg backdrop-blur-sm">
        <div className="flex gap-1.5 items-center">
          <div 
            className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--typing-dot))] animate-bounce" 
            style={{ animationDelay: "0ms" }}
          />
          <div 
            className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--typing-dot))] animate-bounce [animation-delay:0.1s]" 
            style={{ animationDelay: "100ms" }}
          />
          <div 
            className="w-2.5 h-2.5 rounded-full bg-[hsl(var(--typing-dot))] animate-bounce [animation-delay:0.2s]" 
            style={{ animationDelay: "200ms" }}
          />
        </div>
      </div>
    </div>
  );
};
