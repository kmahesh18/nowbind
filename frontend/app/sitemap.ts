import type { MetadataRoute } from "next";
import { toAbsoluteUrl } from "@/lib/sitemap";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: toAbsoluteUrl(""),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: toAbsoluteUrl("/explore"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/docs"),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: toAbsoluteUrl("/terms"),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: toAbsoluteUrl("/privacy"),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];
}
