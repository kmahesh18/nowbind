import { MetadataRoute } from "next";
import { API_URL, SITE_URL } from "@/lib/constants";
import type { Post, Tag, PaginatedResponse } from "@/lib/types";

export const dynamic = "force-dynamic"; // Always generate on request

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/explore`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    { url: `${SITE_URL}/search`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/docs`, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/terms`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 500) {
      // Limit to 500 pages (25,000 posts)
      const res = await fetch(`${API_URL}/posts?per_page=50&page=${page}`);
      if (!res.ok) break;
      const data: PaginatedResponse<Post> = await res.json();

      const posts = data.data || [];
      if (posts.length === 0) break;

      for (const post of posts) {
        entries.push({
          url: `${SITE_URL}/post/${post.slug}`,
          lastModified: new Date(post.updated_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }

      if (page >= (data.total_pages || 1)) {
        hasMore = false;
      } else {
        page++;
      }
    }
  } catch {
    // Fail gracefully
  }

  try {
    let page = 1;
    let hasMore = true;
    while (hasMore && page <= 100) {
      // Limit to 100 pages (5,000 tags)
      const res = await fetch(`${API_URL}/tags?per_page=50&page=${page}`);
      if (!res.ok) break;
      const data: PaginatedResponse<Tag> = await res.json();

      const tags = data.data || [];
      if (tags.length === 0) break;

      for (const tag of tags) {
        entries.push({
          url: `${SITE_URL}/tag/${tag.slug}`,
          changeFrequency: "weekly",
          priority: 0.5,
        });
      }

      if (page >= (data.total_pages || 1)) {
        hasMore = false;
      } else {
        page++;
      }
    }
  } catch {
    // Fail gracefully
  }

  return entries;
}
