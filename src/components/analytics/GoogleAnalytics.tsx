"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { useEffect, useState } from "react";

const GA_ID = "G-3ZJ5NL0711";

function isLocalHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

export function SiteAnalytics() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (isLocalHost(window.location.hostname)) return;
    setEnabled(true);
  }, []);

  if (!enabled) return null;
  return <GoogleAnalytics gaId={GA_ID} />;
}
