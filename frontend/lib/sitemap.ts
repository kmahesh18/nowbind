import type { MetadataRoute } from "next";
import { API_URL, SITE_URL } from "@/lib/constants";
import type { PaginatedResponse } from "@/lib/types";

export const SITEMAP_REVALIDATE_SECONDS = 60 * 60;

interface FetchSitemapEntriesOptions<T> {
  getPath: (page: number) => string;
  mapEntry: (item: T) => MetadataRoute.Sitemap[number] | null;
  maxPages?: number;
}

function toAbsoluteUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

async function fetchPage<T>(
  path: string,
): Promise<PaginatedResponse<T> | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    return res.json();
  } catch {
    return null;
  }
}

export async function fetchSitemapEntries<T>({
  getPath,
  mapEntry,
  maxPages = 100,
}: FetchSitemapEntriesOptions<T>): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (let page = 1; page <= maxPages; page++) {
    const data = await fetchPage<T>(getPath(page));
    if (!data) break;

    const items = data.data || [];
    if (items.length === 0) break;

    for (const item of items) {
      const entry = mapEntry(item);
      if (entry) {
        entries.push(entry);
      }
    }

    if (page >= (data.total_pages || 1)) {
      break;
    }
  }

  return entries;
}

export function toLastModified(value?: string | null): string | undefined {
  if (!value) return undefined;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() <= 1) {
    return undefined;
  }

  return value;
}

export { toAbsoluteUrl };
