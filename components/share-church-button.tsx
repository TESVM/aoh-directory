"use client";

import { useState } from "react";

export function ShareChurchButton({
  title,
  url
}: {
  title: string;
  url: string;
}) {
  const [message, setMessage] = useState("");

  async function handleShare() {
    const absoluteUrl = typeof window === "undefined" ? url : new URL(url, window.location.origin).toString();

    try {
      if (navigator.share) {
        await navigator.share({ title, url: absoluteUrl });
        setMessage("Shared");
        return;
      }

      await navigator.clipboard.writeText(absoluteUrl);
      setMessage("Link copied");
      window.setTimeout(() => setMessage(""), 2000);
    } catch {
      setMessage("Share canceled");
      window.setTimeout(() => setMessage(""), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-500 hover:text-brand-700"
    >
      {message || "Share Church"}
    </button>
  );
}
