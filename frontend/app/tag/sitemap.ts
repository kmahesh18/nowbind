import type { MetadataRoute } from "next";
import type { Tag } from "@/lib/types";
import { fetchSitemapEntries, toAbsoluteUrl } from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return fetchSitemapEntries<Tag>({
    getPath: (page) => `/tags?per_page=50&page=${page}`,
    mapEntry: (tag) => {
      if (tag.post_count === 0) {
        return null;
      }

      return {
        url: toAbsoluteUrl(`/tag/${tag.slug}`),
        changeFrequency: "weekly",
        priority: 0.5,
      };
    },
  });
}
