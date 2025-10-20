import { useState, useRef, useEffect, useCallback } from "react";
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";
import { PrivateChatIndicator } from "./PrivateChatIndicator";
import { Sidebar } from "./Sidebar";
import { PersonalizationModal } from "./PersonalizationModal";
import { OnboardingModal } from "./OnboardingModal";
import { StarterQuestions } from "./StarterQuestions";
import { ChatIntroCard } from "./ChatIntroCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Loader2, ChevronDown, Lock, Unlock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  createChat,
  getChatById,
  updateChatTitle,
  generateChatTitle,
  Chat,
  PersonalizationData,
  updatePersonalization,
  getUserChats,
} from "@/services/chatService";
import { UserMetadata } from "@/types/database";
import {
  getChatMessages,
  createMessage,
  Message as DbMessage,
} from "@/services/messageService";
import { hasCompletedOnboarding, completeOnboarding, getUserMetadata } from "@/services/userService";
import { ensureUserExists } from "@/services/diagnostics";
import { testSupabaseConnection } from "@/services/connectionTest";
import { forceCompleteOnboarding } from "@/utils/onboardingHelpers";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  status?: "sending" | "sent" | "error";
}

const AVATAR_URL = "https://i.postimg.cc/9DmTgNzj/image.png";

export const MultiChatInterface = () => {
  const { user } = useAuth();
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAttemptedAutoCreate = useRef(false);

  // Load user metadata
  useEffect(() => {
    const loadMetadata = async () => {
      if (user) {
        const metadata = await getUserMetadata(user.id);
        setUserMetadata(metadata);
      }
    };
    loadMetadata();
  }, [user]);

  // Check onboarding status on mount
  useEffect(() => {
    const checkOnboarding = async () => {
      if (user) {
        // Run connection test first
        console.log('Running Supabase connection test...');
        await testSupabaseConnection();
        
        const completed = await hasCompletedOnboarding(user.id);
        if (!completed) {
          setOnboardingOpen(true);
        }
      }
    };
    checkOnboarding();
  }, [user]);

  const handleOnboardingComplete = async (personalization: PersonalizationData) => {
    if (!user) return;
    
    console.log('Onboarding complete, creating first chat...');
    
    // Mark onboarding as completed
    await completeOnboarding(user.id);
    
    // Create first chat with personalization
    const newChat = await createChat(user.id);
    if (newChat) {
      console.log('First chat created:', newChat.id);
      
      // Update chat with personalization
      await updatePersonalization(newChat.id, personalization);
      
      // Reload chat to get personalization
      const updatedChat = await getChatById(newChat.id);
      if (updatedChat) {
        setCurrentChat(updatedChat);
        setMessages([]);
        setShowIntroCard(true); // Ensure intro card shows
        setRefreshTrigger(prev => prev + 1); // Refresh sidebar
      }
    }
    
    setOnboardingOpen(false);
    setHasCheckedOnboarding(true); // Mark onboarding as checked
  };

  const handleQuestionClick = (question: string) => {
    setInputValue(question);
    // Auto-submit after a short delay
    setTimeout(() => {
      if (inputRef.current) {
        sendMessage();
      }
    }, 100);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (currentChat) {
      loadChatMessages(currentChat.id);
    }
  }, [currentChat]);

  const loadChatMessages = async (chatId: string) => {
    const dbMessages = await getChatMessages(chatId);
    const formattedMessages: Message[] = dbMessages.map((msg) => ({
      id: msg.id,
      text: msg.content,
      isUser: msg.role === "user",
      timestamp: new Date(msg.created_at).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }),
      status: "sent",
    }));
    setMessages(formattedMessages);
  };

  const handleChatSelect = async (chatId: string) => {
    const chat = await getChatById(chatId);
    if (chat) {
      setCurrentChat(chat);
    }
  };

  const handleNewChat = async () => {
    if (!user?.id) {
      toast({
        title: "Error",
        description: "Please log in first",
        variant: "destructive",
      });
      return;
    }

    if (isCreatingChat) {
      console.log('Chat creation already in progress, skipping...');
      return;
    }

    setIsCreatingChat(true);
    
    try {
      if (isPrivateMode) {
        const tempChat: Chat = {
          id: `temp-${Date.now()}`,
          user_id: user.id,
          title: 'Private Chat',
          personalization: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_private: true
        };
        setCurrentChat(tempChat);
        setMessages([]);
        setShowIntroCard(true);
      } else {
        const newChat = await createChat(user.id);

        if (!newChat) {
          throw new Error('Failed to create chat. Please check your connection and try again.');
        }

        setCurrentChat(newChat);
        setMessages([]);
        setShowIntroCard(true);
        setRefreshTrigger(prev => prev + 1);
        
        toast({
          title: "Success",
          description: "New chat created!",
        });
      }
    } catch (error: any) {
      console.error('Error creating chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create chat. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingChat(false);
    }
  };
  
  // Wrapper to prevent unhandled promise rejections
  const handleNewChatSafe = () => {
    handleNewChat().catch(err => {
      console.error('Unhandled error in handleNewChat:', err);
    });
  };

  // Auto-create first chat if user has completed onboarding but has no chats
  // This effect runs only once per session using a ref to prevent infinite loops
  useEffect(() => {
    if (!user || onboardingOpen || hasCheckedOnboarding || hasAttemptedAutoCreate.current) {
      return;
    }
    
    const autoCreateFirstChat = async () => {
      hasAttemptedAutoCreate.current = true;
      
      try {
        const completed = await hasCompletedOnboarding(user.id);
        
        if (!completed) {
          setHasCheckedOnboarding(true);
          return;
        }
        
        const { data: existingChats, error: chatsError } = await supabase
          .from('chats')
          .select('id')
          .eq('user_id', user.id)
          .or('is_private.is.null,is_private.eq.false')
          .limit(1);
        
        if (chatsError) {
          console.error('Failed to check existing chats:', chatsError);
          setHasCheckedOnboarding(true);
          return;
        }
        
        if (!existingChats || existingChats.length === 0) {
          console.log('No chats found, auto-creating first chat...');
          
          const newChat = await createChat(user.id);
          
          if (newChat) {
            setCurrentChat(newChat);
            setMessages([]);
            setShowIntroCard(true);
            setRefreshTrigger(prev => prev + 1);
          }
        }
        
        setHasCheckedOnboarding(true);
      } catch (error) {
        console.error('Error in auto-create:', error);
        setHasCheckedOnboarding(true);
      }
    };
    
    // Small delay to allow other effects to settle
    const timer = setTimeout(autoCreateFirstChat, 300);
    return () => clearTimeout(timer);
  }, [user, onboardingOpen, hasCheckedOnboarding]);

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

  const buildSystemPrompt = () => {
    if (!currentChat?.personalization) {
      return "You are HD Physique AI assistant, a personalized fitness coach helping users with their training and nutrition goals.";
    }

    const p = currentChat.personalization;
    const parts = [
      "You are HD Physique AI assistant, a personalized fitness coach. User Profile:",
      p.fitnessLevel && `Fitness Level: ${p.fitnessLevel}`,
      p.primaryGoals && p.primaryGoals.length > 0 && `Goals: ${p.primaryGoals.join(', ')}`,
      p.availableEquipment && `Equipment: ${p.availableEquipment}`,
      p.workoutFrequency && `Workout Frequency: ${p.workoutFrequency}`,
      p.dietaryPreferences && p.dietaryPreferences.length > 0 && `Dietary: ${p.dietaryPreferences.join(', ')}`,
    ];

    return parts.filter(Boolean).join(" | ");
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading || isSending || !currentChat || !user)
      return;

    const messageText = inputValue.trim();
    const userMessageId = Date.now().toString();

    const userMessage: Message = {
      id: userMessageId,
      text: messageText,
      isUser: true,
      timestamp: getCurrentTimestamp(),
      status: "sending",
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setIsSending(true);

    try {
      // Save user message to database (skip if private)
      if (!currentChat.is_private) {
        await createMessage(currentChat.id, "user", messageText);
      }

      // If this is the first message, auto-generate chat title (skip if private)
      if (messages.length === 0 && !currentChat.is_private) {
        const title = generateChatTitle(messageText);
        await updateChatTitle(currentChat.id, title);
        setCurrentChat({ ...currentChat, title });
      }

      // Build system prompt with personalization
      const systemPrompt = buildSystemPrompt();

      // Send to AI
      const payload: {
        dateCode: string;
        message: string;
        system_prompt: string;
        user_id: string;
        chat_id?: string;
      } = {
        dateCode: getDateCode(),
        message: messageText,
        system_prompt: systemPrompt,
        user_id: user.id,
      };

      if (!currentChat.is_private) {
        payload.chat_id = currentChat.id;
      }

      const { data, error } = await supabase.functions.invoke("chat-proxy", {
        body: payload,
      });

      if (error) {
        throw new Error(error.message || "Failed to communicate with AI");
      }

      if (!data || !Array.isArray(data) || !data[0]?.output) {
        throw new Error("Invalid response format");
      }

      const aiResponse = data[0].output;

      // Save AI response to database (skip if private)
      if (!currentChat.is_private) {
        await createMessage(currentChat.id, "assistant", aiResponse);
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId ? { ...msg, status: "sent" } : msg
        )
      );

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        isUser: false,
        timestamp: getCurrentTimestamp(),
        status: "sent",
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === userMessageId ? { ...msg, status: "error" } : msg
        )
      );

      const errorMessage =
        error instanceof Error
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
    const messageToRetry = messages.find((m) => m.id === messageId);
    if (!messageToRetry || !messageToRetry.isUser) return;

    setMessages((prev) => prev.filter((m) => m.id !== messageId));
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
    <div className="flex h-screen bg-gradient-to-br from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)]">
      <Sidebar
        currentChatId={currentChat?.id || null}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChatSafe}
        onPersonalize={() => setPersonalizationOpen(true)}
        refreshTrigger={refreshTrigger}
      />

      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            <div className="flex items-center justify-between bg-gradient-to-r from-[hsl(174,45%,20%)] to-[hsl(164,55%,25%)] px-4 py-3 border-b border-white/10 rounded-t-lg">
              <div className="flex items-center gap-3">
                <img 
                  src={AVATAR_URL}
                  alt="HD-Physique"
                  className="h-10 w-10 rounded-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'center 20%'
                  }}
                />
                <div className="flex flex-col">
                  <h2 className="text-white font-semibold text-base">HD-Physique</h2>
                  <p className="text-white/70 text-xs">{isLoading ? "Thinking..." : "AI Assistant"}</p>
                </div>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20">
                    {isPrivateMode ? (
                      <><Lock className="h-4 w-4" /> Private</>
                    ) : (
                      <><Unlock className="h-4 w-4" /> Normal</>
                    )}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuItem 
                    onClick={() => setIsPrivateMode(!isPrivateMode)}
                    className="gap-2 cursor-pointer"
                  >
                    <input 
                      type="checkbox" 
                      checked={isPrivateMode}
                      onChange={(e) => setIsPrivateMode(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <div>
                      <div className="font-semibold">Private Mode</div>
                      <div className="text-xs text-muted-foreground">
                        Chats won't be saved to history
                      </div>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div
              className="flex-1 overflow-y-auto p-2 md:p-4 space-y-2 chat-scrollbar"
              aria-label="Chat messages"
              aria-live="polite"
            >
              {/* Private chat indicator */}
              {isPrivateMode && <PrivateChatIndicator isPrivate={true} />}
              
              {/* Show intro card for new chats */}
              {messages.length === 0 && showIntroCard && (
                <div className="max-w-4xl mx-auto mt-8">
                  <ChatIntroCard />
                  <div className="mt-8">
                    <StarterQuestions onQuestionClick={handleQuestionClick} />
                  </div>
                </div>
              )}

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
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to HD Physique
              </h2>
              <p className="text-white/70 mb-6">
                Select a chat or create a new one to get started
              </p>
              <Button
                onClick={handleNewChatSafe}
                className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Onboarding Modal */}
      <OnboardingModal
        open={onboardingOpen}
        onComplete={handleOnboardingComplete}
      />

      {/* Personalization Modal */}
      {currentChat && (
        <PersonalizationModal
          open={personalizationOpen}
          onClose={() => setPersonalizationOpen(false)}
          chatId={currentChat.id}
          currentPersonalization={currentChat.personalization}
        />
      )}
    </div>
  );
};
