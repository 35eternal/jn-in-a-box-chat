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
        className={`flex gap-4 mb-8 group ${isUser ? "justify-end" : "justify-start"} ${
          isUser ? "animate-slide-in-right" : "animate-slide-in-left"
        }`}
      >
        {!isUser && avatarUrl && (
          <Avatar className="h-12 w-12 shrink-0 flex-shrink-0 order-first sm:order-last">
            <AvatarImage src={avatarUrl} alt="AI Assistant" />
            <AvatarFallback className="bg-accent text-accent-foreground border border-accent/20">AI</AvatarFallback>
          </Avatar>
        )}
        
        <div className="flex flex-col max-w-[85%] md:max-w-[75%]">
          <div className="relative">
            <div
              className={`px-5 py-4 max-w-full rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                isUser
                  ? `bg-gradient-to-r from-[hsl(var(--user-message-start))] to-[hsl(var(--user-message-end))] text-primary-foreground rounded-br-xl rounded-tr-xl border border-primary/20`
                  : `bg-[hsl(var(--ai-message-bg))] text-foreground rounded-bl-xl rounded-br-xl border border-accent/30 backdrop-blur-sm`
              }`}
            >
              {isUser ? (
                <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message}</p>
              ) : (
                <div className="text-sm prose prose-sm max-w-none prose-headings:text-foreground prose-strong:font-semibold prose-code:bg-muted/50 prose-pre:bg-card prose-a:text-primary hover:prose-a:text-primary/80">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
                      strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                      em: ({ children }) => <em className="italic text-foreground/90">{children}</em>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                      code: ({ children }: { children: React.ReactNode }) => (
                        <code className="bg-muted px-2 py-1 rounded text-xs font-mono border">{children}</code>
                      ),
                      pre: ({ children }) => (
                        <pre className="bg-card p-4 rounded-lg overflow-auto text-xs font-mono border my-4">
                          {children}
                        </pre>
                      ),
                      a: ({ children, href }) => (
                        <a 
                          href={href} 
                          className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {children}
                        </a>
                      ),
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
              className={`absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 h-7 w-7 p-0 bg-card hover:bg-accent text-foreground border border-border shadow-md rounded-full`}
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
              <div className="flex items-center gap-1 bg-destructive/10 px-2 py-1 rounded-full">
                <AlertCircle className="h-3 w-3 text-destructive" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onRetry}
                  className="h-auto p-1 text-xs text-destructive hover:text-destructive/80 hover:bg-destructive/20 rounded"
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
