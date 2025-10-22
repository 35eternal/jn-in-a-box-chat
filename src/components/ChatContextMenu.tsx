import {
  ReactNode,
  cloneElement,
  isValidElement,
  useCallback,
  useMemo,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Edit3, FolderPlus, MoreVertical, Star, Trash2 } from "lucide-react";
import "./ChatContextMenu.css";

interface ChatContextMenuProps {
  chatId: string;
  chatTitle: string;
  onRename: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  children: ReactNode;
}

type ActionVariant = "default" | "danger";

interface ActionItem {
  key: string;
  label: string;
  icon: ReactNode;
  shortcut?: string;
  variant?: ActionVariant;
  handler: () => void;
}

export const ChatContextMenu = ({
  chatId,
  chatTitle,
  onRename,
  onDelete,
  children,
}: ChatContextMenuProps) => {
  const [contextMenuOpen, setContextMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleStar = useCallback(() => {
    console.info("Star chat:", chatId);
  }, [chatId]);

  const handleRename = useCallback(() => {
    onRename(chatId);
  }, [chatId, onRename]);

  const handleAddToProject = useCallback(() => {
    console.info("Add to project:", chatId);
  }, [chatId]);

  const handleDelete = useCallback(() => {
    onDelete(chatId);
  }, [chatId, onDelete]);

  const actions = useMemo<ActionItem[]>(
    () => [
      {
        key: "star",
        label: "Star",
        icon: <Star className="h-4 w-4" aria-hidden="true" />,
        shortcut: "Shift + S",
        handler: handleStar,
      },
      {
        key: "rename",
        label: "Rename",
        icon: <Edit3 className="h-4 w-4" aria-hidden="true" />,
        shortcut: "⌘ R",
        handler: handleRename,
      },
      {
        key: "add-project",
        label: "Add to project",
        icon: <FolderPlus className="h-4 w-4" aria-hidden="true" />,
        handler: handleAddToProject,
      },
      {
        key: "delete",
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" aria-hidden="true" />,
        variant: "danger",
        handler: handleDelete,
      },
    ],
    [handleAddToProject, handleDelete, handleRename, handleStar],
  );

  const renderedTrigger = useMemo(() => {
    if (!isValidElement(children)) {
      return children;
    }

    return cloneElement(children, {
      className: cn("chat-context-trigger-button", children.props.className),
    });
  }, [children]);

  const isMenuOpen = contextMenuOpen || dropdownOpen;

  const renderDropdownItems = () => {
    const nodes: ReactNode[] = [];
    actions.forEach((action, index) => {
      if (action.variant === "danger" && index !== 0) {
        nodes.push(
          <DropdownMenuSeparator
            key={`dropdown-separator-${action.key}`}
            className="chat-action-separator"
          />,
        );
      }

      nodes.push(
        <DropdownMenuItem
          key={`dropdown-${action.key}`}
          className={cn("chat-action-item", action.variant && `chat-action-item--${action.variant}`)}
          onSelect={(event) => {
            event.preventDefault();
            action.handler();
            setDropdownOpen(false);
          }}
        >
          {action.icon}
          <span>{action.label}</span>
          {action.shortcut ? (
            <DropdownMenuShortcut className="chat-action-shortcut">
              {action.shortcut}
            </DropdownMenuShortcut>
          ) : null}
        </DropdownMenuItem>,
      );
    });
    return nodes;
  };

  const renderContextItems = () => {
    const nodes: ReactNode[] = [];
    actions.forEach((action, index) => {
      if (action.variant === "danger" && index !== 0) {
        nodes.push(
          <ContextMenuSeparator
            key={`context-separator-${action.key}`}
            className="chat-action-separator"
          />,
        );
      }

      nodes.push(
        <ContextMenuItem
          key={`context-${action.key}`}
          className={cn("chat-action-item", action.variant && `chat-action-item--${action.variant}`)}
          onSelect={() => {
            action.handler();
            setContextMenuOpen(false);
          }}
        >
          {action.icon}
          <span>{action.label}</span>
          {action.shortcut ? (
            <ContextMenuShortcut className="chat-action-shortcut">
              {action.shortcut}
            </ContextMenuShortcut>
          ) : null}
        </ContextMenuItem>,
      );
    });
    return nodes;
  };

  return (
    <ContextMenu onOpenChange={setContextMenuOpen}>
      <div className="chat-context-wrapper" data-open={isMenuOpen ? "true" : "false"}>
        <ContextMenuTrigger asChild>
          <div className="chat-context-trigger">
            {renderedTrigger}
            <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="chat-menu-trigger"
                  onClick={(event) => event.stopPropagation()}
                  onMouseDown={(event) => event.stopPropagation()}
                >
                  <MoreVertical className="h-4 w-4" aria-hidden="true" />
                  <span className="sr-only">Open options for {chatTitle}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="chat-action-menu"
              >
                <div className="chat-action-heading">
                  <span className="chat-action-heading-title">
                    {chatTitle || "Untitled chat"}
                  </span>
                  <span className="chat-action-heading-subtitle">Quick actions</span>
                </div>
                <div className="chat-action-items">{renderDropdownItems()}</div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent className="chat-action-menu">
          <div className="chat-action-heading">
            <span className="chat-action-heading-title">
              {chatTitle || "Untitled chat"}
            </span>
            <span className="chat-action-heading-subtitle">Quick actions</span>
          </div>
          <div className="chat-action-items">{renderContextItems()}</div>
        </ContextMenuContent>
      </div>
    </ContextMenu>
  );
};
