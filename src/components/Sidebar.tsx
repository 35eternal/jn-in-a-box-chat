import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, Settings, LogOut, ChevronLeft, Menu, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, getUserChats, createChat } from '@/services/chatService';
import { formatDistanceToNow } from 'date-fns';
import { resetOnboarding } from '@/utils/onboardingHelpers';

interface SidebarProps {
  currentChatId: string | null;
  onChatSelect: (chatId: string) => void;
  onNewChat: () => void;
  onPersonalize: () => void;
  refreshTrigger?: number;
}

export const Sidebar = ({ currentChatId, onChatSelect, onNewChat, onPersonalize, refreshTrigger }: SidebarProps) => {
  const { user, signOut } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadChats();
    }
  }, [user]);

  // Refresh chats when trigger changes
  useEffect(() => {
    if (user && refreshTrigger !== undefined) {
      loadChats();
    }
  }, [refreshTrigger, user]);

  const loadChats = async () => {
    if (!user) return;
    setIsLoading(true);
    const userChats = await getUserChats(user.id);
    setChats(userChats);
    setIsLoading(false);
  };

  const handleNewChat = () => {
    try {
      // Simply call the parent callback - let parent handle chat creation
      onNewChat();
    } catch (err) {
      console.error('Error in handleNewChat:', err);
    }
  };

  const groupChatsByDate = () => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recent: Chat[] = [];
    const older: Chat[] = [];

    chats.forEach((chat) => {
      const chatDate = new Date(chat.created_at);
      if (chatDate >= thirtyDaysAgo) {
        recent.push(chat);
      } else {
        older.push(chat);
      }
    });

    return { recent, older };
  };

  const { recent, older } = groupChatsByDate();

  if (isCollapsed) {
    return (
      <div className="w-16 bg-[hsl(174,40%,14%)] border-r border-white/10 flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="text-white hover:bg-white/10 mb-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewChat}
          className="text-white hover:bg-white/10 mb-2"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-[hsl(174,40%,14%)] border-r border-white/10 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏋️</span>
            <h2 className="text-lg font-bold text-white">HD Physique</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <Button
          onClick={handleNewChat}
          className="w-full bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        {isLoading && chats.length === 0 ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-white/50">Loading...</div>
          </div>
        ) : chats.length === 0 ? (
          <div className="p-4 text-center text-white/50">No chats yet</div>
        ) : (
          <div className="space-y-4 py-4">
            {recent.length > 0 && (
              <div>
                <h3 className="px-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Last 30 days
                </h3>
                <div className="space-y-1">
                  {recent.map((chat) => (
                    <Button
                      key={chat.id}
                      variant="ghost"
                      onClick={() => onChatSelect(chat.id)}
                      className={`w-full justify-start text-left hover:bg-white/10 ${
                        currentChatId === chat.id ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex-1 overflow-hidden">
                        <div className="text-white text-sm truncate">{chat.title}</div>
                        <div className="text-white/40 text-xs">
                          {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {older.length > 0 && (
              <div>
                <h3 className="px-2 text-xs font-semibold text-white/50 uppercase tracking-wider mb-2">
                  Older
                </h3>
                <div className="space-y-1">
                  {older.map((chat) => (
                    <Button
                      key={chat.id}
                      variant="ghost"
                      onClick={() => onChatSelect(chat.id)}
                      className={`w-full justify-start text-left hover:bg-white/10 ${
                        currentChatId === chat.id ? 'bg-white/10' : ''
                      }`}
                    >
                      <div className="flex-1 overflow-hidden">
                        <div className="text-white text-sm truncate">{chat.title}</div>
                        <div className="text-white/40 text-xs">
                          {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <Button
          variant="ghost"
          onClick={onPersonalize}
          className="w-full justify-start text-white hover:bg-white/10"
        >
          <Settings className="h-4 w-4 mr-2" />
          Personalize
        </Button>
        <Button
          variant="ghost"
          onClick={async () => {
            if (!user) return;
            const confirmed = window.confirm(
              'Reset tutorial? This will clear your preferences and show the onboarding again. Your chat history will remain intact.'
            );
            if (confirmed) {
              const success = await resetOnboarding(user.id);
              if (success) {
                setTimeout(() => window.location.reload(), 1000);
              }
            }
          }}
          className="w-full justify-start text-white hover:bg-white/10"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Tutorial
        </Button>
        <Separator className="bg-white/10" />
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-white truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-white hover:bg-white/10 ml-2"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
