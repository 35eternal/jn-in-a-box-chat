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
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [chatToDelete, setChatToDelete] = useState<string | null>(null);

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

  const handleDeleteChat = (chatId: string) => {
    setChatToDelete(chatId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteChat = async () => {
    if (!chatToDelete) return;

    const success = await deleteChat(chatToDelete);
    if (success) {
      toast({
        title: "Success",
        description: "Chat deleted successfully",
      });
      
      // If we deleted the current chat, switch to a different one or create new
      if (currentChatId === chatToDelete) {
        const remainingChats = chats.filter(c => c.id !== chatToDelete);
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
    setIsDeleteDialogOpen(false);
    setChatToDelete(null);
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
      <div className="w-16 bg-sidebar border-r border-sidebar-border flex flex-col items-center py-4 transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="text-sidebar-foreground hover:bg-sidebar-accent hover:shadow-md transition-all duration-200 mb-4"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNewChat}
          className="text-sidebar-foreground hover:bg-primary hover:text-primary-foreground hover:shadow-md transition-all duration-200 mb-2"
        >
          <MessageSquarePlus className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏋️</span>
            <h2 className="text-foreground font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">HD Physique</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="text-sidebar-foreground hover:bg-accent hover:shadow-md transition-all duration-200 rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        </div>
        <Button
          onClick={handleNewChat}
          className="!w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 rounded-lg"
        >
          <MessageSquarePlus className="h-4 w-4 mr-2" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        {isLoading && chats.length === 0 ? (
          <div className="space-y-3 py-8 px-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-3">
                <div className="h-10 bg-accent/30 rounded-lg animate-pulse shadow-sm" />
              </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 p-5 bg-gradient-to-br from-accent/20 to-primary/10 rounded-2xl shadow-lg border border-accent/30">
              <MessageSquarePlus className="h-10 w-10 text-muted-foreground/70 mx-auto" />
            </div>
            <div className="text-foreground/80 text-lg md:text-xl mb-3 font-semibold">No chats yet</div>
            <div className="text-muted-foreground/80 text-sm md:text-base leading-relaxed max-w-xs mx-auto">Ready to start your fitness journey? Create your first chat and get personalized coaching.</div>
            <Button
              onClick={handleNewChat}
              variant="outline"
              size="sm"
              className="mt-4 border-accent/50 hover:bg-accent/20 text-muted-foreground hover:text-foreground transition-all duration-200"
            >
              <MessageSquarePlus className="h-4 w-4 mr-2" />
              Create First Chat
            </Button>
          </div>
        ) : (
          <div className="space-y-6 py-4 px-2">
            {recent.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-primary uppercase tracking-wider mb-3 border-b border-accent/50">
                  Last 30 days
                </h3>
                <div className="space-y-1">
                  {recent.map((chat, index) => (
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
                        className={`w-full justify-start text-left px-3 py-3 rounded-lg transition-all duration-200 hover:bg-accent hover:shadow-md hover:scale-[1.02] ${
                          currentChatId === chat.id ? 'bg-primary text-primary-foreground shadow-lg border border-primary/20' : 'hover:bg-accent/70'
                        }`}
                      >
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium text-sm truncate pr-2">{chat.title}</div>
                          <div className="text-xs opacity-75">
                            {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        {currentChatId === chat.id && <div className="ml-2 w-1 h-4 bg-primary rounded-full" />}
                      </Button>
                    </ChatContextMenu>
                  ))}
                </div>
              </div>
            )}

            {older.length > 0 && (
              <div>
                <h3 className="px-3 py-2 text-xs font-semibold text-primary uppercase tracking-wider mb-3 border-b border-accent/50">
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
                        className={`w-full justify-start text-left px-3 py-3 rounded-lg transition-all duration-200 hover:bg-accent hover:shadow-md hover:scale-[1.02] ${
                          currentChatId === chat.id ? 'bg-primary text-primary-foreground shadow-lg border border-primary/20' : 'hover:bg-accent/70'
                        }`}
                      >
                        <div className="flex-1 overflow-hidden">
                          <div className="font-medium text-sm truncate pr-2">{chat.title}</div>
                          <div className="text-xs opacity-75">
                            {formatDistanceToNow(new Date(chat.created_at), { addSuffix: true })}
                          </div>
                        </div>
                        {currentChatId === chat.id && <div className="ml-2 w-1 h-4 bg-primary rounded-full" />}
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
      <div className="p-4 border-t border-border space-y-3 bg-sidebar/50 backdrop-blur-sm">
        <AdminAccessButton />
        <Button
          variant="ghost"
          onClick={onPersonalize}
          className="w-full justify-start text-foreground hover:bg-accent hover:shadow-md transition-all duration-200 rounded-lg px-3 py-2"
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
          className="w-full justify-start text-foreground hover:bg-accent hover:shadow-md transition-all duration-200 rounded-lg px-3 py-2"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Tutorial
        </Button>
        <Separator className="bg-border" />
        <Separator className="bg-border" />
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="text-foreground hover:bg-accent hover:shadow-md transition-all duration-200 rounded-lg ml-2"
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
        <DialogContent className="bg-card border-border text-foreground max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rename Chat</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter a new name for this chat
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="chat-title" className="text-foreground">
                Chat Title
              </Label>
              <Input
                id="chat-title"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter chat title"
                className="bg-muted border-input text-foreground placeholder:text-muted-foreground focus-visible:ring-ring"
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
              className="border-input text-foreground hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameSubmit}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border text-foreground max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Chat</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Are you sure you want to delete this chat? This action cannot be undone and will also delete all messages in the conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-input text-foreground hover:bg-accent">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteChat}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
