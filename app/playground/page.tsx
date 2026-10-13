import { SchemaPlayground } from "@/components/playground";

// Protected by an opaque-origin iframe and a CSP sandbox header even if
// the /playground route is visited directly.
export default function PlaygroundPage() {
  return <SchemaPlayground />;
}
