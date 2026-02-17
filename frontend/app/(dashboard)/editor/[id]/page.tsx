"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BlockEditor } from "@/components/editor/block-editor";
import { useMediaUpload } from "@/lib/hooks/use-media-upload";
import { api } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import type { Post } from "@/lib/types";
import type { JSONContent } from "novel";
import { Save, Send, X, Loader2 } from "lucide-react";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditPostPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { uploadMedia } = useMediaUpload();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [contentJSON, setContentJSON] = useState<JSONContent | undefined>();
  const [initialContent, setInitialContent] = useState<JSONContent | undefined>();
  const [excerpt, setExcerpt] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Post>(`/posts/${id}`)
      .then((p) => {
        setPost(p);
        setTitle(p.title);
        setSubtitle(p.subtitle || "");
        setExcerpt(p.excerpt || "");
        setTags(p.tags?.map((t) => t.name) || []);

        if (p.content_format === "tiptap" && p.content_json) {
          try {
            const parsed = JSON.parse(p.content_json);
            setInitialContent(parsed);
            setContentJSON(parsed);
          } catch {
            // Fallback: empty editor
          }
        }
      })
      .catch(() => router.push("/dashboard"))
      .finally(() => setLoading(false));
  }, [id, router]);

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

  const handleSave = async () => {
    if (!post) return;
    setSaving(true);
    try {
      const updated = await api.put<Post>(`/posts/${post.id}`, {
        title,
        subtitle,
        content_json: contentJSON ? JSON.stringify(contentJSON) : undefined,
        excerpt,
        tags,
      });
      setPost(updated);
    } catch (err) {
      console.error("Failed to save:", err);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!post) return;
    setSaving(true);
    try {
      await handleSave();
      await api.post(`/posts/${post.id}/publish`);
      if (post) {
        router.push(`/post/${post.slug}`);
      }
    } catch (err) {
      console.error("Failed to publish:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <div className="mx-auto max-w-5xl space-y-4 px-4 py-6">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-6 w-96" />
            <Skeleton className="h-[400px] w-full" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-lg font-semibold">Edit Post</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save
              </Button>
              {post?.status === "draft" && (
                <Button size="sm" onClick={handlePublish} disabled={saving}>
                  <Send className="mr-2 h-4 w-4" />
                  Publish
                </Button>
              )}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
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
            initialContent={initialContent}
            onChange={setContentJSON}
            onImageUpload={uploadMedia}
          />
        </div>
      </main>
    </div>
  );
}
