import { memo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle2, AlertCircle, Loader2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  timestamp: string;
  avatarUrl?: string;
  status?: 'sending' | 'sent' | 'error';
  onRetry?: () => void;
}

export const ChatMessage = memo(({ message, isUser, timestamp, avatarUrl, status, onRetry }: ChatMessageProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive",
      });
    }
  };

  return (
    <div
      className={`flex gap-2 mb-4 group ${isUser ? "justify-end" : "justify-start"} ${
        isUser ? "animate-slide-in-right" : "animate-slide-in-left"
      }`}
    >
      {!isUser && avatarUrl && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={avatarUrl} alt="AI Assistant" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
      )}
      
      <div className="flex flex-col max-w-[85%] md:max-w-[75%]">
        <div className="relative">
          <div
            className={`px-4 py-3 shadow-md backdrop-blur-sm transition-all duration-200 hover:shadow-lg ${
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
          
          {/* Copy button - shows on hover */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className={`absolute ${
              isUser ? "-left-8" : "-right-8"
            } top-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-[rgba(0,0,0,0.5)] hover:bg-[rgba(0,0,0,0.7)] text-white border border-white/20`}
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
        
        <div className={`flex items-center gap-2 mt-1 ${isUser ? "justify-end" : "justify-start"}`}>
          <span className="text-xs text-muted-foreground animate-in fade-in duration-500 delay-300">
            {timestamp}
          </span>
          
          {isUser && status === 'sending' && (
            <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
          )}
          
          {isUser && status === 'sent' && (
            <CheckCircle2 className="h-3 w-3 text-green-400" />
          )}
          
          {isUser && status === 'error' && onRetry && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3 text-red-400" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                className="h-auto p-0 text-xs text-red-400 hover:text-red-300 hover:bg-transparent"
              >
                Retry
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.message === nextProps.message &&
         prevProps.timestamp === nextProps.timestamp &&
         prevProps.status === nextProps.status;
});
