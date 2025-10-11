import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  avatarUrl?: string;
}

export const TypingIndicator = ({ avatarUrl }: TypingIndicatorProps) => {
  return (
    <div className="flex gap-2 mb-4 animate-slide-in-left">
      {avatarUrl && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl} alt="AI Assistant" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      
      <div className="bg-[rgba(0,0,0,0.3)] px-4 py-3 rounded-[10px_10px_10px_0]">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-white/60 animate-typing-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-white/60 animate-typing-bounce" style={{ animationDelay: "200ms" }} />
          <div className="w-2 h-2 rounded-full bg-white/60 animate-typing-bounce" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
};
