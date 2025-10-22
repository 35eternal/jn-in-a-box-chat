import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  avatarUrl?: string;
}

export const TypingIndicator = ({ avatarUrl }: TypingIndicatorProps) => {
  return (
    <div className="flex gap-3 mb-6 animate-slide-in-left">
      {avatarUrl && (
        <Avatar className="h-10 w-10 shrink-0 flex-shrink-0">
          <AvatarImage src={avatarUrl} alt="AI Assistant" />
          <AvatarFallback className="bg-muted text-muted-foreground">AI</AvatarFallback>
        </Avatar>
      )}
      
      <div className="bg-muted px-4 py-3 rounded-bl-lg rounded-br-lg shadow-md">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce" style={{ animationDelay: "0ms" }} />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce" style={{ animationDelay: "200ms" }} />
          <div className="w-2 h-2 rounded-full bg-muted-foreground animate-typing-bounce" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
};
