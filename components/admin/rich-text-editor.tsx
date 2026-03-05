"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import { useState, useEffect, useCallback } from "react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  rows?: number;
}

function ToolbarButton({
  onClick,
  isActive,
  title,
  children,
}: {
  onClick: () => void;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-xs font-medium transition-colors ${
        isActive
          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
          : "text-zinc-600 hover:bg-zinc-200 dark:text-zinc-400 dark:hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function EditorToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-zinc-200 bg-zinc-50 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-800/50">
      {/* Text Style Group */}
      <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 dark:border-zinc-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          title="Bold"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          title="Italic"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive("underline")}
          title="Underline"
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          title="Strikethrough"
        >
          <s>S</s>
        </ToolbarButton>
      </div>

      {/* Heading Group */}
      <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 pl-2 dark:border-zinc-700">
        <select
          value={
            editor.isActive("heading", { level: 1 })
              ? "1"
              : editor.isActive("heading", { level: 2 })
                ? "2"
                : editor.isActive("heading", { level: 3 })
                  ? "3"
                  : editor.isActive("heading", { level: 4 })
                    ? "4"
                    : "p"
          }
          onChange={(e) => {
            const val = e.target.value;
            if (val === "p") {
              editor.chain().focus().setParagraph().run();
            } else {
              editor
                .chain()
                .focus()
                .toggleHeading({ level: parseInt(val) as 1 | 2 | 3 | 4 })
                .run();
            }
          }}
          className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
        >
          <option value="p">Paragraph</option>
          <option value="1">Heading 1</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 pl-2 dark:border-zinc-700">
        <select
          onChange={(e) => {
            const size = e.target.value;
            if (size === "default") {
              editor.chain().focus().unsetMark("textStyle").run();
            } else {
              editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
            }
          }}
          className="rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-xs text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
          defaultValue="default"
        >
          <option value="default">Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
          <option value="28px">28px</option>
          <option value="32px">32px</option>
        </select>
      </div>

      {/* Color */}
      <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 pl-2 dark:border-zinc-700">
        <input
          type="color"
          onInput={(e) =>
            editor.chain().focus().setColor((e.target as HTMLInputElement).value).run()
          }
          className="h-6 w-6 cursor-pointer rounded border border-zinc-300 dark:border-zinc-600"
          title="Text Color"
        />
      </div>

      {/* List Group */}
      <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 pl-2 dark:border-zinc-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          title="Bullet List"
        >
          &#8226; List
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          title="Numbered List"
        >
          1. List
        </ToolbarButton>
      </div>

      {/* Alignment Group */}
      <div className="flex items-center gap-0.5 border-r border-zinc-200 pr-2 pl-2 dark:border-zinc-700">
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          isActive={editor.isActive({ textAlign: "left" })}
          title="Align Left"
        >
          &#8676;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          isActive={editor.isActive({ textAlign: "center" })}
          title="Align Center"
        >
          &#8596;
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          isActive={editor.isActive({ textAlign: "right" })}
          title="Align Right"
        >
          &#8677;
        </ToolbarButton>
      </div>

      {/* Block Group */}
      <div className="flex items-center gap-0.5 pl-2">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          title="Blockquote"
        >
          &ldquo; Quote
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive("codeBlock")}
          title="Code Block"
        >
          {"</>"}
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Horizontal Rule"
        >
          &#8212;
        </ToolbarButton>
      </div>
    </div>
  );
}

// Extend TextStyle to support fontSize
const FontSizeTextStyle = TextStyle.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize || null,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) return {};
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
});

export function RichTextEditor({ value, onChange, rows = 10 }: RichTextEditorProps) {
  const [isRawMode, setIsRawMode] = useState(false);
  const [rawHtml, setRawHtml] = useState(value);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      FontSizeTextStyle,
      Color,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      setRawHtml(html);
    },
    editorProps: {
      attributes: {
        class:
          "prose prose-sm sm:prose-base prose-zinc dark:prose-invert max-w-none focus:outline-none px-4 py-3",
        style: `min-height: ${rows * 1.5}rem`,
      },
    },
  });

  // Sync value from parent to editor
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
      setRawHtml(value);
    }
  }, [value, editor]);

  const handleRawChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const html = e.target.value;
      setRawHtml(html);
      onChange(html);
      if (editor) {
        editor.commands.setContent(html, { emitUpdate: false });
      }
    },
    [editor, onChange]
  );

  const toggleMode = useCallback(() => {
    if (isRawMode) {
      if (editor) {
        editor.commands.setContent(rawHtml, { emitUpdate: false });
      }
    } else {
      if (editor) {
        setRawHtml(editor.getHTML());
      }
    }
    setIsRawMode(!isRawMode);
  }, [isRawMode, editor, rawHtml]);

  return (
    <div className="overflow-hidden rounded-md border border-zinc-300 dark:border-zinc-700">
      {/* Mode Toggle */}
      <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 py-1 dark:border-zinc-700 dark:bg-zinc-800/50">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {isRawMode ? "HTML Mode" : "Editor Mode"}
        </span>
        <button
          type="button"
          onClick={toggleMode}
          className="rounded px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
        >
          {isRawMode ? "Switch to Editor" : "Switch to HTML"}
        </button>
      </div>

      {isRawMode ? (
        <textarea
          value={rawHtml}
          onChange={handleRawChange}
          rows={rows}
          className="w-full resize-y bg-zinc-950 px-4 py-3 font-mono text-sm text-green-400 focus:outline-none dark:bg-zinc-950"
          style={{ maxHeight: `${rows * 3}rem` }}
          spellCheck={false}
        />
      ) : editor ? (
        <>
          <EditorToolbar editor={editor} />
          <div className="overflow-auto" style={{ maxHeight: `${rows * 3}rem` }}>
            <EditorContent editor={editor} />
          </div>
        </>
      ) : null}
    </div>
  );
}
