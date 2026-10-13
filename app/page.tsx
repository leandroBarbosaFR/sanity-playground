"use client";

import { useEffect, useRef } from "react";

// Run the editor in an opaque-origin sandbox. User-authored schemas and
// components never execute with access to the application's origin.
const STORAGE_KEYS = [
  "schema-playground:code",
  "schema-playground:component",
  "schema-playground:component-saved",
] as const;

export default function Home() {
  const frame = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow) return;
      const message = event.data;
      if (!message || message.channel !== "sanity-playground-storage") return;
      if (message.type === "read") {
        const values: Record<string, string> = {};
        for (const key of STORAGE_KEYS) {
          try {
            const value = localStorage.getItem(key);
            if (value !== null) values[key] = value;
          } catch { /* Storage unavailable */ }
        }
        frame.current?.contentWindow?.postMessage(
          { channel: "sanity-playground-storage", type: "hydrate", values }, "*"
        );
      } else if (message.type === "write" && STORAGE_KEYS.includes(message.key) && typeof message.value === "string" && message.value.length < 1_000_000) {
        try { localStorage.setItem(message.key, message.value); } catch { /* Storage unavailable */ }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return <iframe ref={frame} title="Sanity schema playground" src="/playground" sandbox="allow-scripts" className="h-dvh w-full border-0" />;
}
