import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, Settings, LogOut, ChevronLeft, Menu, RotateCcw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Chat, getUserChats, deleteChat } from '@/services/chatService';
import { formatDistanceToNow } from 'date-fns';
import { resetOnboarding } from '@/utils/onboardingHelpers';
import { ChatContextMenu } from '@/components/ChatContextMenu';
import { AdminAccessButton } from '@/components/AdminAccessButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateChatTitle } from '@/services/chatService';
import { toast } from '@/hooks/use-toast';

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
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedChatForRename, setSelectedChatForRename] = useState<Chat | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');

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

  const handleRenameChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setSelectedChatForRename(chat);
      setNewChatTitle(chat.title);
      setIsRenameDialogOpen(true);
    }
  };

  const handleRenameSubmit = async () => {
    if (!selectedChatForRename || !newChatTitle.trim()) return;

    const success = await updateChatTitle(selectedChatForRename.id, newChatTitle);
    if (success) {
      toast({
        title: "Success",
        description: "Chat renamed successfully",
      });
      setIsRenameDialogOpen(false);
      setSelectedChatForRename(null);
      setNewChatTitle('');
      loadChats();
    } else {
      toast({
        title: "Error",
        description: "Failed to rename chat",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this chat? This action cannot be undone.');
    if (!confirmed) return;

    const success = await deleteChat(chatId);
    if (success) {
      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
      
      // If we deleted the current chat, switch to a different one or create new
      if (currentChatId === chatId) {
        const remainingChats = chats.filter(c => c.id !== chatId);
        if (remainingChats.length > 0) {
          onChatSelect(remainingChats[0].id);
        } else {
          onNewChat();
        }
      }
      
      loadChats();
    } else {
      toast({
        title: "Error",
        description: "Failed to delete chat",
        variant: "destructive",
      });
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
                    <ChatContextMenu
                      key={chat.id}
                      chatId={chat.id}
                      chatTitle={chat.title}
                      onRename={handleRenameChat}
                      onDelete={handleDeleteChat}
                    >
                      <Button
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
                    </ChatContextMenu>
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
                    <ChatContextMenu
                      key={chat.id}
                      chatId={chat.id}
                      chatTitle={chat.title}
                      onRename={handleRenameChat}
                      onDelete={handleDeleteChat}
                    >
                      <Button
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
                    </ChatContextMenu>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-2">
        <AdminAccessButton />
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

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-gradient-to-b from-[hsl(174,40%,18%)] to-[hsl(174,35%,15%)] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription className="text-white/70">
              Enter a new name for this chat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-title" className="text-white">
                Chat Title
              </Label>
              <Input
                id="chat-title"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter chat title"
                className="bg-[hsl(174,30%,20%)] border-white/20 text-white placeholder:text-white/50"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsRenameDialogOpen(false);
                setSelectedChatForRename(null);
                setNewChatTitle('');
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              className="bg-gradient-to-r from-[hsl(153,60%,35%)] to-[hsl(192,55%,35%)] hover:from-[hsl(153,60%,40%)] hover:to-[hsl(192,55%,40%)] text-white"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
