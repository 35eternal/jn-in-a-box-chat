import {
  Fragment,
  ReactNode,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Edit3,
  FolderPlus,
  Search,
  Settings as SettingsIcon,
  Share2,
  Star,
  Trash2,
} from "lucide-react";
import "./ChatContextMenu.css";

interface ChatContextMenuProps {
  chatId: string;
  chatTitle: string;
  onRename: (chatId: string) => void;
  onDelete: (chatId: string) => void;
  children: ReactNode;
}

interface ActionItem {
  key: string;
  label: string;
  icon: ReactNode;
  meta?: string;
  handler: () => void;
}

interface ActionSection {
  id: string;
  label: string;
  variant?: "default" | "danger";
  items: ActionItem[];
}

const clampHue = (value: number) => {
  if (Number.isNaN(value)) return 0;
  if (value < 0) return 0;
  if (value > 360) return 360;
  return value;
};

const createHuePair = () => {
  const base = clampHue(120 + Math.floor(Math.random() * 240));
  const accentBase = base - 80 + (Math.floor(Math.random() * 60) - 30);
  return { base, accent: clampHue(accentBase) };
};

export const ChatContextMenu = ({
  chatId,
  chatTitle,
  onRename,
  onDelete,
  children,
}: ChatContextMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const hueSeedRef = useRef(createHuePair());
  const [hue1, setHue1] = useState(hueSeedRef.current.base);
  const [hue2, setHue2] = useState(hueSeedRef.current.accent);

  const menuRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const handleStar = useCallback(() => {
    console.info("Star chat:", chatId);
  }, [chatId]);

  const handleRename = useCallback(() => {
    onRename(chatId);
  }, [chatId, onRename]);

  const handleShare = useCallback(() => {
    console.info("Share summary for chat:", chatId);
  }, [chatId]);

  const handleAddToProject = useCallback(() => {
    console.info("Add to project:", chatId);
  }, [chatId]);

  const handleReview = useCallback(() => {
    console.info("Open chat settings:", chatId);
  }, [chatId]);

  const handleDelete = useCallback(() => {
    onDelete(chatId);
  }, [chatId, onDelete]);

  const sections: ActionSection[] = useMemo(
    () => [
      {
        id: "suggestions",
        label: "Quick actions",
        items: [
          {
            key: "rename",
            label: "Rename chat",
            icon: <Edit3 className="h-4 w-4" />,
            meta: "⌘ R",
            handler: handleRename,
          },
          {
            key: "star",
            label: "Star chat",
            icon: <Star className="h-4 w-4" />,
            meta: "Shift + S",
            handler: handleStar,
          },
          {
            key: "share",
            label: "Share summary",
            icon: <Share2 className="h-4 w-4" />,
            meta: "Coming soon",
            handler: handleShare,
          },
        ],
      },
      {
        id: "settings",
        label: "Manage chat",
        items: [
          {
            key: "add-project",
            label: "Add to project",
            icon: <FolderPlus className="h-4 w-4" />,
            handler: handleAddToProject,
          },
          {
            key: "review",
            label: "Open chat settings",
            icon: <SettingsIcon className="h-4 w-4" />,
            handler: handleReview,
          },
        ],
      },
      {
        id: "danger",
        label: "Danger zone",
        variant: "danger",
        items: [
          {
            key: "delete",
            label: "Delete chat",
            icon: <Trash2 className="h-4 w-4" />,
            handler: handleDelete,
          },
        ],
      },
    ],
    [handleAddToProject, handleDelete, handleRename, handleReview, handleShare, handleStar],
  );

  const actionMap = useMemo(() => {
    const map = new Map<string, ActionItem>();
    sections.forEach((section) => {
      section.items.forEach((item) => map.set(item.key, item));
    });
    return map;
  }, [sections]);

  const filteredSections = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return sections;
    }

    return sections
      .map((section) => {
        const items = section.items.filter((item) => {
          const inLabel = item.label.toLowerCase().includes(term);
          const inMeta = item.meta?.toLowerCase().includes(term);
          return inLabel || inMeta;
        });
        return { ...section, items };
      })
      .filter((section) => section.items.length > 0);
  }, [searchTerm, sections]);

  const filteredKeys = useMemo(
    () => filteredSections.flatMap((section) => section.items.map((item) => item.key)),
    [filteredSections],
  );

  const closeMenu = useCallback(() => {
    setIsOpen(false);
    setSearchTerm("");
    setSelectedKey(null);
  }, []);

  const handleContextMenu = useCallback((event: React.MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const { clientX, clientY } = event;
    setPosition({ x: clientX, y: clientY });
    setSearchTerm("");
    setSelectedKey(null);
    setIsOpen(true);
  }, []);

  const handleMenuKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (!isOpen) return;

      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key === "Tab") {
        event.preventDefault();
        return;
      }

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (!filteredKeys.length) return;

        const currentIndex = selectedKey ? filteredKeys.indexOf(selectedKey) : -1;
        const offset = event.key === "ArrowDown" ? 1 : -1;
        const nextIndex =
          currentIndex === -1
            ? 0
            : (currentIndex + offset + filteredKeys.length) % filteredKeys.length;

        const nextKey = filteredKeys[nextIndex];
        setSelectedKey(nextKey);

        const nextElement = menuRef.current?.querySelector<HTMLLIElement>(
          `li[data-action-key="${nextKey}"]`,
        );
        nextElement?.focus();
      }

      if (event.key === "Enter" && selectedKey) {
        const action = actionMap.get(selectedKey);
        if (action) {
          event.preventDefault();
          action.handler();
          closeMenu();
        }
      }
    },
    [actionMap, closeMenu, filteredKeys, isOpen, selectedKey],
  );

  const handleActionSelect = useCallback(
    (item: ActionItem) => {
      item.handler();
      closeMenu();
    },
    [closeMenu],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target)) {
        closeMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeMenu, isOpen]);

  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const frame = requestAnimationFrame(() => {
      const menu = menuRef.current;
      if (!menu) return;

      const rect = menu.getBoundingClientRect();
      const paddingX = 30;
      const paddingY = 20;
      const { innerWidth, innerHeight } = window;

      let nextX = position.x;
      let nextY = position.y;

      if (nextX + rect.width > innerWidth - paddingX) {
        nextX = Math.max(paddingX, innerWidth - rect.width - paddingX);
      }
      if (nextY + rect.height > innerHeight - paddingY) {
        nextY = Math.max(paddingY, innerHeight - rect.height - paddingY);
      }
      if (nextX < paddingX) {
        nextX = paddingX;
      }
      if (nextY < paddingY) {
        nextY = paddingY;
      }

      if (nextX !== position.x || nextY !== position.y) {
        setPosition({ x: nextX, y: nextY });
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen, position.x, position.y]);

  useEffect(() => {
    if (!isOpen) return;

    requestAnimationFrame(() => {
      searchInputRef.current?.focus({ preventScroll: true });
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (!filteredKeys.length) {
      setSelectedKey(null);
      return;
    }

    if (!selectedKey || !filteredKeys.includes(selectedKey)) {
      setSelectedKey(filteredKeys[0] ?? null);
    }
  }, [filteredKeys, isOpen, selectedKey]);

  useEffect(() => {
    document.documentElement.style.setProperty("--neon-menu-hue1", hue1.toString());
  }, [hue1]);

  useEffect(() => {
    document.documentElement.style.setProperty("--neon-menu-hue2", hue2.toString());
  }, [hue2]);

  return (
    <>
      <span className="neon-context-menu-trigger" onContextMenu={handleContextMenu}>
        {children}
      </span>

      <aside
        ref={menuRef}
        tabIndex={-1}
        role="menu"
        aria-hidden={!isOpen}
        aria-label={`Actions for ${chatTitle}`}
        className={`neon-context-menu${isOpen ? " open" : ""}`}
        style={{ top: `${position.y}px`, left: `${position.x}px` }}
        onKeyDown={handleMenuKeyDown}
      >
        <span className="shine shine-top" />
        <span className="shine shine-bottom" />
        <span className="glow glow-top" />
        <span className="glow glow-bottom" />
        <span className="glow glow-bright glow-top" />
        <span className="glow glow-bright glow-bottom" />

        <div className="inner">
          <div className="neon-context-menu-content">
            <div className="neon-context-menu-title">
              <h2>{chatTitle || "Chat actions"}</h2>
              <p>Right-click to open this menu anywhere inside the chat list.</p>
            </div>

            <label className="search">
              <Search className="h-4 w-4" aria-hidden="true" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Type a command or search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </label>

            {filteredSections.length > 0 ? (
              filteredSections.map((section, index) => (
                <Fragment key={section.id}>
                  <section className={section.variant === "danger" ? "danger" : undefined}>
                    <header>{section.label}</header>
                    <ul role="none">
                      {section.items.map((item) => (
                        <li
                          key={item.key}
                          data-action-key={item.key}
                          role="menuitem"
                          tabIndex={-1}
                          className={selectedKey === item.key ? "selected" : undefined}
                          aria-selected={selectedKey === item.key}
                          onMouseEnter={() => setSelectedKey(item.key)}
                          onFocus={() => setSelectedKey(item.key)}
                          onClick={() => handleActionSelect(item)}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                          {item.meta ? <span className="meta">{item.meta}</span> : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                  {index < filteredSections.length - 1 ? <hr /> : null}
                </Fragment>
              ))
            ) : (
              <div data-empty-state>
                No quick actions match “{searchTerm.trim() || "…"}”.
              </div>
            )}

            <hr />

            <footer className="neon-context-menu-footer">
              <h3>Pick your own colors</h3>
              <div className="neon-context-menu-slider-group">
                <div className="neon-context-menu-slider">
                  <span>Primary hue</span>
                  <input
                    id="neon-hue-1"
                    type="range"
                    min={0}
                    max={360}
                    value={hue1}
                    onChange={(event) => setHue1(clampHue(Number(event.target.value)))}
                  />
                </div>
                <div className="neon-context-menu-slider">
                  <span>Accent hue</span>
                  <input
                    id="neon-hue-2"
                    type="range"
                    min={0}
                    max={360}
                    value={hue2}
                    onChange={(event) => setHue2(clampHue(Number(event.target.value)))}
                  />
                </div>
              </div>
            </footer>
          </div>
        </div>
      </aside>
    </>
  );
};
