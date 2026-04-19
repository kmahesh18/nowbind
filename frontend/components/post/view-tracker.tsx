"use client";

import { useEffect } from "react";
import { api } from "@/lib/api";

interface ViewTrackerProps {
  slug: string;
}

const VIEWED_POST_PREFIX = "nowbind:viewed-post:";

function getExternalReferrer(): string {
  if (typeof document === "undefined" || !document.referrer) {
    return "";
  }

  try {
    const referrerUrl = new URL(document.referrer);
    if (referrerUrl.origin === window.location.origin) {
      return "";
    }
    return document.referrer;
  } catch {
    return "";
  }
}

export function ViewTracker({ slug }: ViewTrackerProps) {
  useEffect(() => {
    if (!slug) return;

    const storageKey = `${VIEWED_POST_PREFIX}${slug}`;
    if (
      typeof window !== "undefined" &&
      sessionStorage.getItem(storageKey) === "1"
    ) {
      return;
    }

    let cancelled = false;
    const referrer = getExternalReferrer();

    api
      .post(`/posts/${slug}/view`, { referrer })
      .then(() => {
        if (!cancelled && typeof window !== "undefined") {
          sessionStorage.setItem(storageKey, "1");
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return null;
}
