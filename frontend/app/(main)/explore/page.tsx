"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PostCard } from "@/components/post/post-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/hooks/use-auth";
import type { Post, Tag, PaginatedResponse } from "@/lib/types";
import { useKeyboardNav } from "@/lib/hooks/use-keyboard-nav";
import { KeyboardShortcutsHelp } from "@/components/keyboard-shortcuts-help";
import {
  TrendingUp,
  Hash,
  Star,
  Clock,
  Heart,
  ArrowRight,
  Keyboard,
} from "lucide-react";

const POSTS_PER_PAGE = 3;

// ---------- Featured Hero Section ----------

function FeaturedSection({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  const hero = posts[0];
  const rest = posts.slice(1, 3);

  return (
    <section className="mb-10">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <Star className="h-3.5 w-3.5" />
        Featured
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Hero card */}
        <Link
          href={`/post/${hero.slug}`}
          className="group relative flex flex-col justify-end overflow-hidden rounded-xl border bg-card md:row-span-2"
        >
          {hero.feature_image ? (
            <img
              src={hero.feature_image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5" />
          )}
          <div className="relative z-10 mt-auto bg-gradient-to-t from-black/80 via-black/50 to-transparent p-5 pt-20 text-white md:p-6 md:pt-32">
            {hero.tags?.[0] && (
              <span className="mb-2 inline-block rounded-full bg-white/20 px-2.5 py-0.5 text-[11px] font-medium backdrop-blur-sm">
                {hero.tags[0].name}
              </span>
            )}
            <h3 className="text-lg font-bold leading-snug md:text-xl">
              {hero.title}
            </h3>
            {hero.excerpt && (
              <p className="mt-1.5 line-clamp-2 text-sm text-white/70">
                {hero.excerpt}
              </p>
            )}
            <div className="mt-3 flex items-center gap-2 text-xs text-white/60">
              {hero.author && (
                <span>{hero.author.display_name || hero.author.username}</span>
              )}
              <span>&middot;</span>
              <span>{hero.reading_time} min read</span>
            </div>
          </div>
        </Link>

        {/* Smaller featured cards */}
        {rest.map((post) => (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            className="group flex flex-col justify-end overflow-hidden rounded-xl border bg-card"
          >
            {post.feature_image ? (
              <div className="relative h-32 overflow-hidden">
                <img
                  src={post.feature_image}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </div>
            ) : (
              <div className="h-20 bg-gradient-to-br from-primary/10 to-primary/5" />
            )}
            <div className="p-4">
              {post.tags?.[0] && (
                <span className="mb-1.5 inline-block text-[11px] font-medium text-primary">
                  {post.tags[0].name}
                </span>
              )}
              <h3 className="text-sm font-bold leading-snug line-clamp-2">
                {post.title}
              </h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {post.author && (
                  <span>
                    {post.author.display_name || post.author.username}
                  </span>
                )}
                <span>&middot;</span>
                <span>{post.reading_time} min</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------- Trending Section ----------

function TrendingSection({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        <TrendingUp className="h-3.5 w-3.5" />
        Trending
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, i) => (
          <Link
            key={post.id}
            href={`/post/${post.slug}`}
            className="group flex gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50"
          >
            <span className="text-2xl font-bold text-muted-foreground/30">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold leading-snug line-clamp-2">
                {post.title}
              </h3>
              <div className="mt-2 flex items-center gap-3">
                {post.author && (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="h-4 w-4">
                      {post.author.avatar_url && (
                        <AvatarImage src={post.author.avatar_url} alt="" />
                      )}
                      <AvatarFallback className="text-[8px]">
                        {(post.author.display_name ||
                          post.author.username)?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {post.author.display_name || post.author.username}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.reading_time} min
                </span>
                {post.like_count > 0 && (
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.like_count}
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------- Topics Section ----------

function TopicsSection({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <Hash className="h-3.5 w-3.5" />
          Topics
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link key={tag.id} href={`/tag/${tag.slug}`}>
            <Badge
              variant="outline"
              className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {tag.name}
              <span className="ml-1.5 text-muted-foreground">
                {tag.post_count}
              </span>
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------- Post List Skeleton ----------

function PostListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-2 border-b pb-6">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-3 pt-1">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Hero Skeleton ----------

function FeaturedSkeleton() {
  return (
    <section className="mb-10">
      <Skeleton className="mb-4 h-4 w-24" />
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-xl md:row-span-2 md:h-auto" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </section>
  );
}

function TrendingSkeleton() {
  return (
    <section className="mb-10">
      <Skeleton className="mb-4 h-4 w-24" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex gap-3 rounded-lg border p-4">
            <Skeleton className="h-8 w-8 shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------- Scroll Sentinel (triggers load-more) ----------

function useInfiniteScroll(
  onLoadMore: () => void,
  loading: boolean,
  hasMore: boolean,
) {
  const callbackRef = useRef(onLoadMore);
  callbackRef.current = onLoadMore;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const hasMoreRef = useRef(hasMore);
  hasMoreRef.current = hasMore;
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Callback ref — fires when the DOM element mounts/unmounts
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    // Disconnect old observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          callbackRef.current();
        }
      },
      { rootMargin: "300px", threshold: 0 },
    );
    observerRef.current.observe(node);
  }, []);

  return sentinelRef;
}

// ---------- Main Page ----------

export default function ExplorePage() {
  const { user, loading: authLoading } = useAuth();

  // Data states
  const [featured, setFeatured] = useState<Post[]>([]);
  const [trending, setTrending] = useState<Post[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Infinite scroll — latest
  const [latestPosts, setLatestPosts] = useState<Post[]>([]);
  const latestPageRef = useRef(0);
  const [latestHasMore, setLatestHasMore] = useState(true);
  const [latestLoading, setLatestLoading] = useState(true);
  const [latestLoadingMore, setLatestLoadingMore] = useState(false);

  // Infinite scroll — feed
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const feedPageRef = useRef(0);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLoadingMore, setFeedLoadingMore] = useState(false);

  // Loading states
  const [heroLoading, setHeroLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState("latest");

  // Fetch hero data (featured, trending, tags) — once
  useEffect(() => {
    setHeroLoading(true);
    Promise.all([
      api
        .get<PaginatedResponse<Post>>("/posts", {
          featured: "true",
          per_page: "3",
          page: "1",
        })
        .then((r) => r.data || [])
        .catch(() => [] as Post[]),
      api
        .get<Post[]>("/posts/trending", { limit: "6" })
        .catch(() => [] as Post[]),
      api
        .get<{ data: Tag[] }>("/tags")
        .then((r) => (r.data || []).slice(0, 10))
        .catch(() => [] as Tag[]),
    ])
      .then(([featuredRes, trendingRes, tagsRes]) => {
        setFeatured(featuredRes);
        setTrending(trendingRes);
        setTags(tagsRes);
      })
      .finally(() => setHeroLoading(false));
  }, []);

  // Fetch latest posts — initial load
  useEffect(() => {
    setLatestLoading(true);
    latestPageRef.current = 1;
    api
      .get<PaginatedResponse<Post>>("/posts", {
        page: "1",
        per_page: String(POSTS_PER_PAGE),
      })
      .then((res) => {
        setLatestPosts(res.data || []);
        setLatestHasMore((res.page || 1) < (res.total_pages || 1));
      })
      .catch((err) => console.error("Failed to load latest posts:", err))
      .finally(() => setLatestLoading(false));
  }, []);

  // Fetch latest posts — load more on scroll
  const loadMoreLatest = useCallback(() => {
    if (latestLoadingMore || !latestHasMore) return;
    const nextPage = latestPageRef.current + 1;
    setLatestLoadingMore(true);
    api
      .get<PaginatedResponse<Post>>("/posts", {
        page: String(nextPage),
        per_page: String(POSTS_PER_PAGE),
      })
      .then((res) => {
        latestPageRef.current = nextPage;
        setLatestPosts((prev) => [...prev, ...(res.data || [])]);
        setLatestHasMore(nextPage < (res.total_pages || 1));
      })
      .catch((err) => console.error("Failed to load more posts:", err))
      .finally(() => setLatestLoadingMore(false));
  }, [latestLoadingMore, latestHasMore]);

  // Fetch feed — initial load
  const feedInitialized = useRef(false);
  useEffect(() => {
    if (activeTab !== "foryou" || authLoading || !user || feedInitialized.current) return;
    feedInitialized.current = true;
    setFeedLoading(true);
    feedPageRef.current = 1;
    api
      .get<PaginatedResponse<Post>>("/feed", {
        page: "1",
        per_page: String(POSTS_PER_PAGE),
      })
      .then((res) => {
        setFeedPosts(res.data || []);
        setFeedHasMore((res.page || 1) < (res.total_pages || 1));
      })
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error("Failed to load feed:", err);
        }
      })
      .finally(() => setFeedLoading(false));
  }, [activeTab, user, authLoading]);

  // Fetch feed — load more on scroll
  const loadMoreFeed = useCallback(() => {
    if (feedLoadingMore || !feedHasMore || !user) return;
    const nextPage = feedPageRef.current + 1;
    setFeedLoadingMore(true);
    api
      .get<PaginatedResponse<Post>>("/feed", {
        page: String(nextPage),
        per_page: String(POSTS_PER_PAGE),
      })
      .then((res) => {
        feedPageRef.current = nextPage;
        setFeedPosts((prev) => [...prev, ...(res.data || [])]);
        setFeedHasMore(nextPage < (res.total_pages || 1));
      })
      .catch((err) => console.error("Failed to load more feed:", err))
      .finally(() => setFeedLoadingMore(false));
  }, [feedLoadingMore, feedHasMore, user]);

  const showForYou = !authLoading && !!user;

  // Keyboard nav — operates on the visible post list
  const visiblePosts = activeTab === "foryou" ? feedPosts : latestPosts;
  const { focusedIndex, showHelp, setShowHelp } = useKeyboardNav({
    posts: visiblePosts,
    enabled: true,
    isAuthenticated: !!user,
    onPostsChange: (updater) => {
      if (activeTab === "foryou") {
        setFeedPosts((prev) => updater(prev));
      } else {
        setLatestPosts((prev) => updater(prev));
      }
    },
  });

  // Infinite scroll sentinels
  const latestSentinelRef = useInfiniteScroll(loadMoreLatest, latestLoadingMore, latestHasMore);
  const feedSentinelRef = useInfiniteScroll(loadMoreFeed, feedLoadingMore, feedHasMore);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-4 py-8">
          {/* Page header */}
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Explore</h1>
              <p className="mt-1 text-muted-foreground">
                Discover stories, ideas, and expertise from the NowBind
                community.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="hidden items-center gap-1.5 rounded-md border px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground sm:flex"
              title="Keyboard shortcuts"
              aria-label="Open keyboard shortcuts"
            >
              <Keyboard className="h-3 w-3" />
              <kbd className="font-mono">?</kbd>
            </button>
          </div>

          <KeyboardShortcutsHelp open={showHelp} onOpenChange={setShowHelp} />

          {/* Featured section */}
          {heroLoading ? (
            <FeaturedSkeleton />
          ) : (
            <FeaturedSection posts={featured} />
          )}

          {/* Trending section */}
          {heroLoading ? (
            <TrendingSkeleton />
          ) : (
            <TrendingSection posts={trending} />
          )}

          {/* Topics section */}
          {!heroLoading && <TopicsSection tags={tags} />}

          {/* Posts tab section */}
          <section>
            {showForYou ? (
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList variant="line" className="mb-6">
                  <TabsTrigger value="latest">Latest</TabsTrigger>
                  <TabsTrigger value="foryou">For You</TabsTrigger>
                </TabsList>

                <TabsContent value="latest">
                  {latestLoading ? (
                    <PostListSkeleton />
                  ) : latestPosts.length === 0 ? (
                    <EmptyState message="No posts published yet. Be the first!" />
                  ) : (
                    <>
                      <div>
                        {latestPosts.map((post, i) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            focused={
                              activeTab === "latest" && focusedIndex === i
                            }
                            data-post-index={i}
                          />
                        ))}
                      </div>
                      {latestHasMore && (
                        <div ref={latestSentinelRef} className="py-4">
                          {latestLoadingMore ? (
                            <PostListSkeleton />
                          ) : (
                            <div className="h-10" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="foryou">
                  {feedLoading ? (
                    <PostListSkeleton />
                  ) : feedPosts.length === 0 ? (
                    <EmptyState message="Follow authors to see their posts here.">
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3"
                        asChild
                      >
                        <Link href="/explore">
                          Discover authors
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </EmptyState>
                  ) : (
                    <>
                      <div>
                        {feedPosts.map((post, i) => (
                          <PostCard
                            key={post.id}
                            post={post}
                            focused={
                              activeTab === "foryou" && focusedIndex === i
                            }
                            data-post-index={i}
                          />
                        ))}
                      </div>
                      {feedHasMore && (
                        <div ref={feedSentinelRef} className="py-4">
                          {feedLoadingMore ? (
                            <PostListSkeleton />
                          ) : (
                            <div className="h-10" />
                          )}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            ) : (
              <>
                <h2 className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Latest
                </h2>
                {latestLoading ? (
                  <PostListSkeleton />
                ) : latestPosts.length === 0 ? (
                  <EmptyState message="No posts published yet. Be the first!" />
                ) : (
                  <>
                    <div>
                      {latestPosts.map((post, i) => (
                        <PostCard
                          key={post.id}
                          post={post}
                          focused={focusedIndex === i}
                          data-post-index={i}
                        />
                      ))}
                    </div>
                    {latestHasMore && (
                      <div ref={latestSentinelRef} className="py-4">
                        {latestLoadingMore ? (
                          <PostListSkeleton />
                        ) : (
                          <div className="h-10" />
                        )}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function EmptyState({
  message,
  children,
}: {
  message: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-12 text-center">
      <p className="text-muted-foreground">{message}</p>
      {children}
    </div>
  );
}
