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

  const MessageContent = isUser ? (
    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed mb-2">{message}</p>
  ) : (
    <div className="text-sm prose prose-sm max-w-none prose-headings:text-foreground prose-strong:font-semibold prose-code:bg-muted prose-pre:bg-muted prose-a:text-primary hover:prose-a:text-primary/80">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic opacity-90">{children}</em>,
          ul: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2">{children}</ol>,
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          code: ({ children }: { children: React.ReactNode }) => (
            <code className="bg-muted px-2 py-1 rounded text-xs font-mono border border-border">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="bg-muted p-4 rounded-lg overflow-auto text-xs font-mono border border-border my-4">
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
  );

  if (status === 'sending') {
    return (
      <div className="message loading new">
        <figure className="avatar">
          <img src={avatarUrl} alt="AI Assistant" />
        </figure>
        <span></span>
        <div className="timestamp">{timestamp}</div>
      </div>
    );
  }

  return (
    <div className={`message ${isUser ? 'message-personal' : ''} ${status === 'error' ? 'error' : ''}`}>
      {!isUser && avatarUrl && (
        <figure className="avatar">
          <img src={avatarUrl} alt="AI Assistant" />
        </figure>
      )}
      <div className="message-content relative group">
        {MessageContent}
        {/* Copy button - adapted position */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 bg-muted hover:bg-accent border border-border rounded"
        >
          {copied ? (
            <Check className="h-3 w-3" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
        {isUser && status === 'error' && onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="mt-1 text-xs text-destructive hover:text-destructive/80 bg-destructive/10 rounded px-2 py-1"
          >
            Retry
          </Button>
        )}
        {isUser && status === 'sent' && (
          <CheckCircle2 className="absolute top-2 left-2 h-3 w-3 text-primary" />
        )}
      </div>
      <div className="timestamp">{timestamp}</div>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.message === nextProps.message &&
         prevProps.timestamp === nextProps.timestamp &&
         prevProps.status === nextProps.status;
});
