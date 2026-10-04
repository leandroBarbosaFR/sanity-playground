import type { Metadata } from "next";
import { SchemaPlayground } from "@/components/playground";

export const metadata: Metadata = {
  title: "Schema playground",
  description: "Write a Sanity schema on the left and see its Studio form on the right.",
};

export default function Home() {
  return <SchemaPlayground />;
}
