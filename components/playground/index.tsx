"use client";

import dynamic from "next/dynamic";

// Sanity UI is styled-components based and the editor reads localStorage,
// so the playground renders on the client only.
export const SchemaPlayground = dynamic(
  () => import("./schema-playground").then((m) => m.SchemaPlayground),
  { ssr: false },
);
