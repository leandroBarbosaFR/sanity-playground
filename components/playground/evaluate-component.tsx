"use client";

import * as React from "react";
import { Component, type ComponentType, type ReactNode } from "react";
import { icons } from "@sanity/icons";
import * as SanityUI from "@sanity/ui";
import { transform } from "sucrase";
import { assetUrl } from "./image-input";

export type PreviewProps = {
  data: Record<string, unknown>;
  urlFor: (source: unknown) => string;
};

const kebab = (text: string) => text.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();

const iconFor = (name: string) => icons[kebab(name.replace(/Icon$/, "")) as keyof typeof icons];
const iconsModule = new Proxy({}, { get: (_target, name) => (typeof name === "string" ? iconFor(name) : undefined) });

function componentRequire(id: string) {
  if (id === "react") return React;
  if (id === "@sanity/ui") return SanityUI;
  if (id === "@sanity/icons") return iconsModule;
  if (id.startsWith("@sanity/icons/")) {
    const name = id.slice("@sanity/icons/".length);
    return { [`${name}Icon`]: iconFor(name) };
  }
  throw new Error(`Only "react", "@sanity/ui" and "@sanity/icons" can be imported here (got "${id}")`);
}

export function evaluateComponent(code: string): ComponentType<PreviewProps> {
  const { code: js } = transform(code, {
    transforms: ["typescript", "jsx", "imports"],
    jsxRuntime: "classic",
    production: true,
  });
  const mod = { exports: {} as Record<string, unknown> };
  new Function("require", "module", "exports", "React", js)(componentRequire, mod, mod.exports, React);

  const exported = mod.exports.default ?? Object.values(mod.exports).find((exportedValue) => typeof exportedValue === "function");
  if (typeof exported !== "function") {
    throw new Error("Export a component, e.g. `export default function Preview({ data }) { ... }`");
  }
  return exported as ComponentType<PreviewProps>;
}

export const urlFor = (source: unknown) => assetUrl(source);

type BoundaryProps = { resetKey: unknown; children: ReactNode; fallback: (error: Error) => ReactNode };

export class PreviewErrorBoundary extends Component<BoundaryProps, { error?: Error; resetKey: unknown }> {
  state: { error?: Error; resetKey: unknown } = { resetKey: this.props.resetKey };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  static getDerivedStateFromProps(props: BoundaryProps, state: { error?: Error; resetKey: unknown }) {
    return props.resetKey !== state.resetKey ? { error: undefined, resetKey: props.resetKey } : null;
  }

  render() {
    return this.state.error ? this.props.fallback(this.state.error) : this.props.children;
  }
}
