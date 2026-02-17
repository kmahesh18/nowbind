"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlockEditor } from "@/components/editor/block-editor";
import { useMediaUpload } from "@/lib/hooks/use-media-upload";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import type { JSONContent } from "novel";
import { Save, Send, X, Loader2 } from "lucide-react";

export default function EditorPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { uploadMedia } = useMediaUpload();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [contentJSON, setContentJSON] = useState<JSONContent | undefined>();
  const [excerpt, setExcerpt] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const addTag = useCallback(() => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  }, [tagInput, tags]);

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const saveAsDraft = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const post = await api.post<{ slug: string }>("/posts", {
        title,
        subtitle,
        content_json: contentJSON ? JSON.stringify(contentJSON) : undefined,
        excerpt,
        tags,
      });
      router.push(`/post/${post.slug}`);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const saveAndPublish = async () => {
    if (!title.trim()) return;
    setPublishing(true);
    try {
      const post = await api.post<{ id: string; slug: string }>("/posts", {
        title,
        subtitle,
        content_json: contentJSON ? JSON.stringify(contentJSON) : undefined,
        excerpt,
        tags,
      });
      await api.post(`/posts/${post.id}/publish`);
      router.push(`/post/${post.slug}`);
    } catch (err) {
      console.error("Failed to publish:", err);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6">
          {/* Toolbar */}
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-lg font-semibold">New Post</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveAsDraft}
                disabled={saving || !title.trim()}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Draft
              </Button>
              <Button
                size="sm"
                onClick={saveAndPublish}
                disabled={publishing || !title.trim()}
              >
                {publishing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Publish
              </Button>
            </div>
          </div>

          {/* Title & Subtitle — Ghost-style borderless */}
          <div className="mb-2">
            <input
              placeholder="Post title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-transparent text-4xl font-bold text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
          </div>
          <div className="mb-4">
            <input
              placeholder="Add a subtitle..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full bg-transparent text-xl text-foreground/70 placeholder:text-muted-foreground/40 outline-none"
            />
          </div>

          {/* Tags & Excerpt — compact row */}
          <div className="mb-6 flex flex-wrap items-center gap-2 border-b border-border/50 pb-4">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button onClick={() => removeTag(tag)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            <input
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
              className="w-28 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
            />
            <span className="text-border">|</span>
            <input
              placeholder="Excerpt..."
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              className="flex-1 bg-transparent text-sm text-foreground/70 placeholder:text-muted-foreground/40 outline-none"
            />
          </div>

          {/* Block Editor */}
          <BlockEditor
            onChange={setContentJSON}
            onImageUpload={uploadMedia}
          />
        </div>
      </main>
    </div>
  );
}
