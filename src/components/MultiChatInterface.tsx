import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "./ChatMessage";
import { PrivateChatIndicator } from "./PrivateChatIndicator";
import { Sidebar } from "./Sidebar";
import { PersonalizationModal } from "./PersonalizationModal";
import { OnboardingModal } from "./OnboardingModal";
import { StarterQuestions } from "./StarterQuestions";
import { ChatIntroCard } from "./ChatIntroCard";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Send, Loader2, ChevronDown, Lock, Unlock, Moon, Sun, MessageSquarePlus, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
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
import './chat-new.css';

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
  const { theme, setTheme } = useTheme();
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [personalizationOpen, setPersonalizationOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [showIntroCard, setShowIntroCard] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isPrivatePreference, setIsPrivatePreference] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);
  const [userMetadata, setUserMetadata] = useState<UserMetadata | null>(null);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const hasAttemptedAutoCreate = useRef(false);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const isPrivateChat = Boolean(currentChat?.is_private);
  const isPrivateModeActive = isPrivateChat || isPrivatePreference;
  const privateModeLabel = isPrivateChat ? "Private" : isPrivatePreference ? "Private next" : "Normal";
  const PrivateModeIcon = isPrivateModeActive ? Lock : Unlock;

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
      if (isPrivatePreference || isPrivateChat) {
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
          console.warn('Supabase chat creation failed, using demo mode');
          // Fallback to demo chat
          const demoChat: Chat = {
            id: `demo-${Date.now()}`,
            user_id: user.id,
            title: 'Demo Chat',
            personalization: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_private: false
          };
          setCurrentChat(demoChat);
          setMessages([]);
          setShowIntroCard(true);
          setIsDemo(true);
          toast({
            title: "Demo Mode",
            description: "Using demo chat (Supabase unavailable).",
          });
          return;
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
      // Additional fallback for unexpected errors
      const demoChat: Chat = {
        id: `demo-${Date.now()}`,
        user_id: user.id,
        title: 'Demo Chat (Error Fallback)',
        personalization: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_private: false
      };
      setCurrentChat(demoChat);
      setMessages([]);
      setShowIntroCard(true);
      setIsDemo(true);
      toast({
        title: "Demo Mode Activated",
        description: "Switched to demo chat due to error.",
        variant: "default", // Not destructive, since we recovered
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
      // Save user message to database (skip if private or demo)
      if (!currentChat.is_private && !isDemo) {
        await createMessage(currentChat.id, "user", messageText);
      }

      // If this is the first message, auto-generate chat title (skip if private or demo)
      if (messages.length === 0 && !currentChat.is_private && !isDemo) {
        const title = generateChatTitle(messageText);
        await updateChatTitle(currentChat.id, title);
        setCurrentChat({ ...currentChat, title });
      }

      // Build system prompt with personalization
      const systemPrompt = buildSystemPrompt();

      // Send to AI (demo mode uses a placeholder response for offline testing)
      let aiResponse: string;
      if (isDemo) {
        // Placeholder for demo - in production, could integrate a local AI or mock
        aiResponse = "Demo response: I'm your fitness coach in demo mode. Tell me about your goals!";
      } else {
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

        aiResponse = data[0].output;
      }

      // Save AI response to database (skip if private or demo)
      if (!currentChat.is_private && !isDemo) {
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
        error instanceof Error && !isDemo
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
    <div className="flex h-screen bg-background">
      <Sidebar
        currentChatId={currentChat?.id || null}
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChatSafe}
        onPersonalize={() => setPersonalizationOpen(true)}
        refreshTrigger={refreshTrigger}
      />

      <div className="flex-1 md:ml-64 w-full">
        {currentChat ? (
          <div className="flex flex-col h-screen w-full max-w-md mx-auto my-4 rounded-3xl shadow-2xl bg-black/50 overflow-hidden md:max-w-none md:mx-0 md:my-0 md:shadow-none md:bg-transparent">
              <div className="flex items-center justify-between bg-black/20 border-b border-white/10 px-4 py-3">
                <div className="flex items-center gap-3">
                  <img 
                    src={AVATAR_URL}
                    alt="HD-Physique"
                    className="h-10 w-10 rounded-full border-2 border-white/20"
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center 20%'
                    }}
                  />
                  <div className="flex flex-col">
                    <h2 className="text-white font-normal text-base uppercase tracking-wide">HD Physique</h2>
                    <p className="text-white/60 text-xs">{isLoading ? "Thinking..." : "Fitness Coach"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleTheme}
                    className="h-8 w-8 p-0 bg-white/10 hover:bg-white/20 text-white border-white/20"
                    aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
                  >
                    {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" /> }
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 px-2 bg-white/10 hover:bg-white/20 text-white border-white/20 gap-1">
                        <PrivateModeIcon className="h-4 w-4" />
                        <span className="text-xs">{privateModeLabel}</span>
                        <ChevronDown className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 bg-black/90 border-white/10 text-white">
                      <DropdownMenuItem
                        onClick={() => setIsPrivatePreference((prev) => !prev)}
                        className="gap-3 cursor-pointer flex items-start text-white hover:bg-white/10"
                      >
                        <Switch
                          checked={isPrivatePreference}
                          onCheckedChange={(checked) => setIsPrivatePreference(checked)}
                          className="data-[state=checked]:bg-[#248A52]"
                        />
                        <div className="flex-1">
                          <div className="font-medium">Private mode for new chats</div>
                          <div className="text-sm text-white/70 mt-1">
                            {isPrivateChat
                              ? "Conversations not saved to history."
                              : "Chats will be saved normally."}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

            <div
              className="flex-1 overflow-y-auto p-4 space-y-4 chat-scrollbar"
              aria-label="Chat messages"
              aria-live="polite"
            >
              {/* Private chat indicator */}
              {isPrivateChat && <PrivateChatIndicator isPrivate />}
              
              {/* Show intro card for new chats */}
              {messages.length === 0 && showIntroCard && (
                <div className="py-16 text-center text-white/70">
                  <ChatIntroCard />
                  <div className="mt-16">
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

              {isLoading && (
                <div className="message loading new">
                  <figure className="avatar">
                    <img src={AVATAR_URL} alt="AI Assistant" />
                  </figure>
                  <span></span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-white/10 bg-black/30 backdrop-blur-sm">
              <div className="flex gap-2 items-end w-full">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isLoading || isSending}
                  aria-label="Type your message"
                  rows={1}
                  className="flex-1 min-h-[40px] max-h-[100px] resize-none bg-transparent border-none text-white placeholder:text-white/70 focus-visible:outline-none focus-visible:ring-0 text-sm font-normal rounded-lg p-3"
                />
                <Button
                  onClick={sendMessage}
                  disabled={isLoading || isSending || !inputValue.trim()}
                  aria-label="Send message"
                  size="sm"
                  className="h-10 px-4 text-xs uppercase font-semibold bg-[#248A52] hover:bg-[#1D7745] text-white rounded-lg shadow-md transition-colors whitespace-nowrap flex-shrink-0"
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-black/30 rounded-2xl md:rounded-none">
            <div className="text-center max-w-sm w-full px-4">
              <div className="w-20 h-20 mx-auto mb-6 p-5 bg-black/20 rounded-2xl border border-white/10">
                <MessageSquarePlus className="h-10 w-10 text-[#248A52] mx-auto" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-4">
                Welcome to HD Physique
              </h2>
              <p className="text-sm text-white/80 mb-6 leading-relaxed">
                Your personalized AI coach for fitness, training, and nutrition. Ready to help you build the physique you deserve.
              </p>
              <Button
                onClick={handleNewChatSafe}
                size="lg"
                className="gap-2 bg-gradient-to-r from-[#248A52] to-[#257287] hover:from-[#1D7745] text-white px-6 py-3 rounded-lg font-semibold shadow-lg"
              >
                <MessageSquarePlus className="h-4 w-4" />
                Start Chat
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
