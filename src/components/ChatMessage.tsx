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
        className={`flex gap-3 mb-6 group ${isUser ? "justify-end" : "justify-start"} ${
          isUser ? "animate-slide-in-right" : "animate-slide-in-left"
        }`}
      >
        {!isUser && avatarUrl && (
          <Avatar className="h-10 w-10 shrink-0 flex-shrink-0">
            <AvatarImage src={avatarUrl} alt="AI Assistant" />
            <AvatarFallback className="bg-muted text-muted-foreground">AI</AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex flex-col max-w-[80%] md:max-w-[70%]">
          <div className="relative">
            <div
              className={`px-4 py-3 max-w-full rounded-lg shadow-md transition-all duration-300 hover:shadow-lg ${
                isUser
                  ? "bg-primary text-primary-foreground rounded-br-md rounded-tr-md"
                  : "bg-muted text-foreground rounded-bl-md rounded-br-md"
              }`}
            >
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message}</p>
              ) : (
                <div className="text-sm prose prose-sm max-w-none">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs">{children}</code>,
                      pre: ({ children }) => <pre className="bg-muted p-3 rounded overflow-auto text-xs">{children}</pre>,
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
              className={`absolute -top-2 right-0 opacity-0 group-hover:opacity-100 transition-all duration-200 h-6 w-6 p-0 bg-background hover:bg-muted text-foreground border border-border shadow-sm`}
            >
              {copied ? (
                <Check className="h-3 w-3 text-primary" />
              ) : (
                <Copy className="h-3 w-3" />
              )}
            </Button>
          </div>
          
          <div className={`flex items-center gap-2 mt-2 ${isUser ? "justify-end" : "justify-start"}`}>
            <span className="text-xs text-muted-foreground font-medium">
              {timestamp}
            </span>
            
            {isUser && status === 'sending' && (
              <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
            )}
            
            {isUser && status === 'sent' && (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            )}
            
            {isUser && status === 'error' && onRetry && (
              <div className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3 text-destructive" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-auto p-0 text-xs text-destructive hover:text-destructive/80 hover:bg-transparent"
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
