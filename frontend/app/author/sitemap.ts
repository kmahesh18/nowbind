import type { MetadataRoute } from "next";
import type { User } from "@/lib/types";
import {
  fetchSitemapEntries,
  toLastModified,
  toAbsoluteUrl,
} from "@/lib/sitemap";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return fetchSitemapEntries<User>({
    getPath: (page) => `/users?per_page=50&page=${page}`,
    mapEntry: (user) => ({
      url: toAbsoluteUrl(`/author/${user.username}`),
      lastModified: toLastModified(user.updated_at),
      changeFrequency: "weekly",
      priority: 0.6,
    }),
  });
}
