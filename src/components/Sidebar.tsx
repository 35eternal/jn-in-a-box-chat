import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquarePlus, Settings, LogOut, ChevronLeft, Menu, RotateCcw, Loader2, Monitor, Sun, Moon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Chat, getUserChats, deleteChat, updateChatTitle } from '@/services/chatService';
import { formatDistanceToNow } from 'date-fns';
import { resetOnboarding } from '@/utils/onboardingHelpers';
import { ChatContextMenu } from '@/components/ChatContextMenu';
import { AdminAccessButton } from '@/components/AdminAccessButton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const { setTheme, theme } = useTheme();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedChatForRename, setSelectedChatForRename] = useState<Chat | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [isSigningOut, setIsSigningOut] = useState(false);

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

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      const message = error instanceof Error ? error.message : 'Failed to sign out. Please try again.';
      toast({
        title: 'Sign out failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSigningOut(false);
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
      <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="text-sidebar-foreground hover:bg-sidebar-accent mb-4 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewChat}
          className="text-sidebar-foreground hover:bg-sidebar-accent mb-2 transition-colors"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏋️</span>
            <h2 className="text-sidebar-foreground font-bold text-lg">HD Physique</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <Button
          onClick={handleNewChat}
          className="!w-full bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground shadow-sm transition-colors"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        {isLoading && chats.length === 0 ? (
          <div className="space-y-4 py-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-2">
                <div className="h-12 bg-sidebar-accent/20 rounded-lg animate-pulse shadow-sm" />
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-sidebar-foreground/60 text-lg mb-2 font-medium">No chats yet</div>
            <div className="text-sidebar-muted-foreground text-sm">Create your first chat to get started</div>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {recent.length > 0 && (
              <div>
                <h3 className="px-2 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider mb-3">
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
                        className={`w-full justify-start text-left hover:bg-sidebar-accent transition-colors ${
                          currentChatId === chat.id ? 'bg-sidebar-accent shadow-md' : ''
                        }`}
                      >
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sidebar-foreground font-medium text-sm truncate pr-2">{chat.title}</div>
                          <div className="text-sidebar-muted-foreground text-xs">
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
                <h3 className="px-2 text-xs font-semibold text-sidebar-muted-foreground uppercase tracking-wider mb-3">
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
                        className={`w-full justify-start text-left hover:bg-sidebar-accent transition-colors ${
                          currentChatId === chat.id ? 'bg-sidebar-accent shadow-md' : ''
                        }`}
                      >
                        <div className="flex-1 overflow-hidden">
                          <div className="text-sidebar-foreground font-medium text-sm truncate pr-2">{chat.title}</div>
                          <div className="text-sidebar-muted-foreground text-xs">
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
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <AdminAccessButton />
        <Button
          variant="ghost"
          onClick={onPersonalize}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
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
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Tutorial
        </Button>
        <Separator className="bg-sidebar-border" />
        <Button
          variant="ghost"
          onClick={() => setTheme(theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system')}
          className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
        >
          {theme === 'system' ? <Monitor className="h-4 w-4 mr-2" /> : theme === 'light' ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
          {theme === 'system' ? 'System' : theme.charAt(0).toUpperCase() + theme.slice(1)} Mode
        </Button>
        <Separator className="bg-sidebar-border" />
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-sidebar-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-sidebar-foreground hover:bg-sidebar-accent ml-2"
            title="Sign out"
            disabled={isSigningOut}
          >
            {isSigningOut ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
        <DialogContent className="bg-sidebar border-sidebar-border text-sidebar-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sidebar-foreground">Rename Chat</DialogTitle>
            <DialogDescription className="text-sidebar-muted-foreground">
              Enter a new name for this chat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-title" className="text-sidebar-foreground">
                Chat Title
              </Label>
              <Input
                id="chat-title"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter chat title"
                className="bg-sidebar-accent border-sidebar-border text-sidebar-foreground placeholder:text-sidebar-muted-foreground"
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
              className="border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              className="bg-sidebar-primary hover:bg-sidebar-primary/90 text-sidebar-primary-foreground"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
