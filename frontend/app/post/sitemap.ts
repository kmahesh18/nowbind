import type { MetadataRoute } from "next";
import type { Post } from "@/lib/types";
import {
  fetchSitemapEntries,
  toLastModified,
  toAbsoluteUrl,
} from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return fetchSitemapEntries<Post>({
    getPath: (page) => `/posts?per_page=50&page=${page}`,
    maxPages: 500,
    mapEntry: (post) => {
      if (post.status !== "published") {
        return null;
      }

      return {
        url: toAbsoluteUrl(`/post/${post.slug}`),
        lastModified: toLastModified(post.updated_at || post.published_at),
        changeFrequency: "weekly",
        priority: 0.7,
      };
    },
  });
}
