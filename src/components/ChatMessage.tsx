import ReactMarkdown from "react-markdown";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  avatarUrl?: string;
}

export const ChatMessage = ({ message, isUser, timestamp, avatarUrl }: ChatMessageProps) => {
  return (
    <div
      className={`flex gap-2 mb-4 ${isUser ? "justify-end" : "justify-start"} ${
        isUser ? "animate-slide-in-right" : "animate-slide-in-left"
      }`}
    >
      {!isUser && avatarUrl && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl} alt="AI Assistant" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-[75%]">
        <div
          className={`px-4 py-2 ${
            isUser
              ? "bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] text-white rounded-[10px_10px_0_10px]"
              : "bg-[rgba(0,0,0,0.3)] text-[rgba(255,255,255,0.9)] rounded-[10px_10px_10px_0]"
          }`}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap break-words">{message}</p>
          ) : (
            <div className="text-sm">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                }}
              >
                {message}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <span className={`text-xs text-muted-foreground mt-1 ${isUser ? "text-right" : "text-left"}`}>
          {timestamp}
        </span>
      </div>
    </div>
  );
};
