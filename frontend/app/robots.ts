import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/dashboard",
        "/editor",
        "/settings",
        "/api-keys",
        "/login",
        "/callback",
        "/notifications",
        "/reading-list",
        "/profile",
      ],
    },
    sitemap: [
      `${SITE_URL}/sitemap.xml`,
      `${SITE_URL}/post/sitemap.xml`,
      `${SITE_URL}/tag/sitemap.xml`,
      `${SITE_URL}/author/sitemap.xml`,
    ],
  };
}
