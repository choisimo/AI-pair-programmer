import { useEffect, useCallback } from "react";

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description?: string;
}

export function useKeyboardNavigation(shortcuts: KeyboardShortcut[]) {
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      shortcuts.forEach((shortcut) => {
        const ctrlMatch = shortcut.ctrl
          ? event.ctrlKey || event.metaKey
          : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          ctrlMatch &&
          shiftMatch &&
          altMatch
        ) {
          event.preventDefault();
          shortcut.action();
        }
      });
    },
    [shortcuts],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);
}

export function useKeyboardShortcuts() {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: "/",
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector(
          "[data-search-input]",
        ) as HTMLInputElement;
        searchInput?.focus();
      },
      description: "Focus search",
    },
    {
      key: "k",
      ctrl: true,
      action: () => {
        document.dispatchEvent(new CustomEvent("open-command-palette"));
      },
      description: "Open command palette",
    },
    {
      key: "Escape",
      action: () => {
        document.dispatchEvent(new CustomEvent("close-all-modals"));
      },
      description: "Close modals",
    },
    {
      key: "ArrowUp",
      alt: true,
      action: () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      },
      description: "Scroll to top",
    },
  ];

  useKeyboardNavigation(shortcuts);
  return shortcuts;
}
