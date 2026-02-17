"use client";

import { useCallback, useState } from "react";
import { API_URL } from "@/lib/constants";

interface UploadResult {
  url: string;
  mime_type: string;
  size: number;
}

export function useMediaUpload() {
  const [uploading, setUploading] = useState(false);

  const uploadMedia = useCallback(async (file: File): Promise<string> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_URL}/media/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Upload failed");
      }

      const data: UploadResult = await res.json();
      return data.url;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadMedia, uploading };
}
