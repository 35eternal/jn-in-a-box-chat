import { useState, useRef, useEffect, useCallback } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  status?: 'sending' | 'sent' | 'error';
}

const AVATAR_URL = "https://i.postimg.cc/9DmTgNzj/image.png";

export const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      text: "👋 Hello! I'm **JN-In-A-Box**, your AI assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      status: 'sent'
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isSending, setIsSending] = useState(false);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const getCurrentTimestamp = () => {
    return new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  const getDateCode = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}${month}${day}`;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || isSending) return;

    const messageText = inputValue.trim();
    const userMessageId = Date.now().toString();
    
    const userMessage: Message = {
      id: userMessageId,
      text: messageText,
      isUser: true,
      timestamp: getCurrentTimestamp(),
      status: 'sending'
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat-proxy', {
        body: {
          dateCode: getDateCode(),
          message: messageText,
        },
      });

      if (error) {
        throw new Error(error.message || "Failed to communicate with AI");
      }

      if (!data || !Array.isArray(data) || !data[0]?.output) {
        throw new Error("Invalid response format");
      }
      
      const aiResponse = data[0].output;
      
      setMessages((prev) => prev.map(msg => 
        msg.id === userMessageId ? { ...msg, status: 'sent' } : msg
      ));
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: getCurrentTimestamp(),
        status: 'sent'
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      
      setMessages((prev) => prev.map(msg => 
        msg.id === userMessageId ? { ...msg, status: 'error' } : msg
      ));
      
      const errorMessage = error instanceof Error 
        ? error.message
        : "Failed to send message. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSending(false);
    }
  };

  const retryMessage = async (messageId: string) => {
    const messageToRetry = messages.find(m => m.id === messageId);
    if (!messageToRetry || !messageToRetry.isUser) return;
    
    setMessages((prev) => prev.filter(m => m.id !== messageId));
    setInputValue(messageToRetry.text);
    setTimeout(() => sendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-2 md:p-4 bg-gradient-to-br from-[hsl(var(--chat-bg-start))] to-[hsl(var(--chat-bg-end))]">
      <div className="w-full max-w-lg h-[90vh] md:h-[85vh] max-h-[650px] flex flex-col bg-gradient-to-b from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)] rounded-lg shadow-2xl border border-white/10">
        <ChatHeader 
          name="JN-In-A-Box" 
          status={isLoading ? "Thinking..." : "AI Assistant"} 
          avatarUrl={AVATAR_URL} 
        />

        <div 
          className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 chat-scrollbar"
          aria-label="Chat messages"
          aria-live="polite"
        >
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message.text}
              isUser={message.isUser}
              timestamp={message.timestamp}
              avatarUrl={!message.isUser ? AVATAR_URL : undefined}
              status={message.status}
              onRetry={() => retryMessage(message.id)}
            />
          ))}
          
          {isLoading && <TypingIndicator avatarUrl={AVATAR_URL} />}
          
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 border-t border-white/10 bg-[hsl(174,40%,16%)]">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              disabled={isLoading || isSending}
              aria-label="Type your message"
              rows={1}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none bg-[hsl(174,30%,20%)] border-white/20 text-white placeholder:text-white/50 focus-visible:ring-2 focus-visible:ring-[hsl(164,65%,50%)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            />
            <Button
              onClick={sendMessage}
              disabled={isLoading || isSending || !inputValue.trim()}
              aria-label="Send message"
              className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white active:scale-95 transition-transform duration-150 h-[44px] w-[44px] p-0"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
