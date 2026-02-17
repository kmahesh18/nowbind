"use client";

import { useState, useEffect } from "react";
import { useEditor } from "novel";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  Type,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

const fontSizes = [
  { label: "Small", value: "0.875rem" },
  { label: "Normal", value: null },
  { label: "Large", value: "1.25rem" },
  { label: "Huge", value: "1.5rem" },
];

export function EditorToolbar() {
  const { editor } = useEditor();
  const [showFontMenu, setShowFontMenu] = useState(false);
  const [, forceUpdate] = useState(0);

  // Re-render toolbar when editor selection/formatting changes
  useEffect(() => {
    if (!editor) return;
    const handler = () => forceUpdate((n) => n + 1);
    editor.on("selectionUpdate", handler);
    editor.on("transaction", handler);
    return () => {
      editor.off("selectionUpdate", handler);
      editor.off("transaction", handler);
    };
  }, [editor]);

  if (!editor) return null;

  const currentFontSize = editor.getAttributes("textStyle").fontSize;
  const currentLabel =
    fontSizes.find((s) => s.value === currentFontSize)?.label || "Normal";

  const items = [
    {
      name: "bold",
      icon: Bold,
      isActive: () => editor.isActive("bold"),
      command: () => editor.chain().focus().toggleBold().run(),
    },
    {
      name: "italic",
      icon: Italic,
      isActive: () => editor.isActive("italic"),
      command: () => editor.chain().focus().toggleItalic().run(),
    },
    {
      name: "underline",
      icon: Underline,
      isActive: () => editor.isActive("underline"),
      command: () => editor.chain().focus().toggleUnderline().run(),
    },
    {
      name: "strike",
      icon: Strikethrough,
      isActive: () => editor.isActive("strike"),
      command: () => editor.chain().focus().toggleStrike().run(),
    },
    {
      name: "code",
      icon: Code,
      isActive: () => editor.isActive("code"),
      command: () => editor.chain().focus().toggleCode().run(),
    },
    {
      name: "link",
      icon: Link,
      isActive: () => editor.isActive("link"),
      command: () => {
        if (editor.isActive("link")) {
          editor.chain().focus().unsetLink().run();
        } else {
          window.dispatchEvent(
            new CustomEvent("editor-url-prompt", { detail: { type: "link" } })
          );
        }
      },
    },
  ];

  return (
    <div className="flex items-center gap-1 border-b px-1 py-1.5">
      {/* Font size selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowFontMenu(!showFontMenu)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors hover:bg-accent"
        >
          <Type className="h-3.5 w-3.5" />
          <span>{currentLabel}</span>
          <ChevronDown className="h-3 w-3" />
        </button>
        {showFontMenu && (
          <div
            className="absolute left-0 top-full z-50 mt-1 w-36 rounded-lg border bg-background p-1 shadow-xl"
            onMouseLeave={() => setShowFontMenu(false)}
          >
            {fontSizes.map((size) => (
              <button
                key={size.label}
                type="button"
                className={cn(
                  "flex w-full items-center rounded-md px-2 py-1 text-sm hover:bg-accent",
                  (size.value === currentFontSize ||
                    (!size.value && !currentFontSize)) &&
                    "bg-accent"
                )}
                onClick={() => {
                  if (size.value) {
                    (editor.chain().focus() as any)
                      .setFontSize(size.value)
                      .run();
                  } else {
                    (editor.chain().focus() as any).unsetFontSize().run();
                  }
                  setShowFontMenu(false);
                }}
              >
                {size.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-0.5 h-4 w-px bg-border" />

      {/* Formatting buttons */}
      {items.map((item) => (
        <button
          key={item.name}
          type="button"
          title={item.name}
          onClick={item.command}
          className={cn(
            "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            item.isActive() && "bg-accent text-foreground"
          )}
        >
          <item.icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
}
