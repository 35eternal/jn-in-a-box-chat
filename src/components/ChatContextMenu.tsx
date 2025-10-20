import { Star, Edit3, FolderPlus, Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface ChatContextMenuProps {
  chatId: string;
  chatTitle: string;
  onRename: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  children: React.ReactNode;
}

export const ChatContextMenu = ({
  chatId,
  chatTitle,
  onRename,
  onDelete,
  children,
}: ChatContextMenuProps) => {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48 bg-[hsl(174,35%,18%)] border-white/10">
        <ContextMenuItem
          className="text-white hover:bg-white/10 cursor-pointer"
          onClick={() => {
            // Star functionality - placeholder for now
            console.log('Star chat:', chatId);
          }}
        >
          <Star className="mr-2 h-4 w-4" />
          <span>Star</span>
        </ContextMenuItem>
        <ContextMenuItem
          className="text-white hover:bg-white/10 cursor-pointer"
          onClick={() => onRename(chatId)}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          <span>Rename</span>
        </ContextMenuItem>
        <ContextMenuItem
          className="text-white hover:bg-white/10 cursor-pointer"
          onClick={() => {
            // Add to project functionality - placeholder for now
            console.log('Add to project:', chatId);
          }}
        >
          <FolderPlus className="mr-2 h-4 w-4" />
          <span>Add to project</span>
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-white/10" />
        <ContextMenuItem
          className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer"
          onClick={() => onDelete(chatId)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          <span>Delete</span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
};
