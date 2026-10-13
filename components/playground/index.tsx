"use client";

import dynamic from "next/dynamic";

export const SchemaPlayground = dynamic(
  () => import("./schema-playground").then((playgroundModule) => playgroundModule.SchemaPlayground),
  { ssr: false },
);
