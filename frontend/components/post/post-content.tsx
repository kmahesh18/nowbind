"use client";

import { useState, useEffect, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { CodeBlock } from "@/components/post/code-block";
import type { Components } from "react-markdown";
import { generateHTML } from "@tiptap/html";
import { Extension } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import TiptapUnderline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import Youtube from "@tiptap/extension-youtube";
import { common, createLowlight } from "lowlight";
import { Callout } from "@/components/editor/extensions/callout";
import { Bookmark } from "@/components/editor/extensions/bookmark";

const lowlight = createLowlight(common);

// Rendering-only extensions for generateHTML
const FontSizeRender = Extension.create({
  name: "fontSize",
  addGlobalAttributes() {
    return [{
      types: ["textStyle"],
      attributes: {
        fontSize: {
          default: null,
          parseHTML: (element) => element.style.fontSize || null,
          renderHTML: (attributes) => {
            if (!attributes.fontSize) return {};
            return { style: `font-size: ${attributes.fontSize}` };
          },
        },
      },
    }];
  },
});

const ImageAlignRender = Extension.create({
  name: "imageAlign",
  addGlobalAttributes() {
    return [{
      types: ["image"],
      attributes: {
        dataAlign: {
          default: "center",
          parseHTML: (element) => element.getAttribute("data-align") || "center",
          renderHTML: (attributes) => {
            const align = attributes.dataAlign || "center";
            const styles: Record<string, string> = {
              left: "display: block; margin-right: auto;",
              center: "display: block; margin-left: auto; margin-right: auto;",
              right: "display: block; margin-left: auto;",
            };
            return { "data-align": align, style: styles[align] || styles.center };
          },
        },
      },
    }];
  },
});

const YoutubeResizeRender = Extension.create({
  name: "youtubeResize",
  addGlobalAttributes() {
    return [{
      types: ["youtube"],
      attributes: {
        containerWidth: {
          default: "100%",
          parseHTML: (element) =>
            element.getAttribute("data-width") || element.style?.maxWidth || "100%",
          renderHTML: (attributes) => {
            const w = attributes.containerWidth || "100%";
            return {
              "data-width": w,
              style: w === "100%" ? "" : `max-width: ${w}; margin-left: auto; margin-right: auto;`,
            };
          },
        },
      },
    }];
  },
});

const tiptapExtensions = [
  StarterKit.configure({ codeBlock: false, horizontalRule: false }),
  TiptapImage,
  TiptapLink,
  TiptapUnderline,
  TextStyle,
  FontSizeRender,
  ImageAlignRender,
  YoutubeResizeRender,
  CodeBlockLowlight.configure({ lowlight }),
  HorizontalRule,
  Youtube,
  Callout,
  Bookmark,
];

interface PostContentProps {
  content: string;
  contentJSON?: string;
  contentFormat?: "markdown" | "tiptap";
}

export function PostContent({ content, contentJSON, contentFormat }: PostContentProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // TipTap JSON rendering
  const tiptapHTML = useMemo(() => {
    if (contentFormat === "tiptap" && contentJSON) {
      try {
        const json = JSON.parse(contentJSON);
        return generateHTML(json, tiptapExtensions);
      } catch {
        return null;
      }
    }
    return null;
  }, [contentJSON, contentFormat]);

  if (tiptapHTML) {
    return (
      <div
        className="tiptap-content"
        dangerouslySetInnerHTML={{ __html: tiptapHTML }}
      />
    );
  }

  // Fallback: Markdown rendering
  const components: Components = mounted
    ? {
        pre({ children }) {
          return <>{children}</>;
        },
        code({ className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || "");
          if (!match) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          }
          return (
            <CodeBlock language={match[1]}>
              {String(children).replace(/\n$/, "")}
            </CodeBlock>
          );
        },
      }
    : {};

  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
