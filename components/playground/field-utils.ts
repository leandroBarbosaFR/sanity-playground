import type { FieldDef, TypeDef } from "./evaluate-schema";

export type Value = unknown;
export type Obj = Record<string, Value>;
export type Registry = Map<string, TypeDef>;

export const startCase = (s: string) =>
  s.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (c) => c.toUpperCase());

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

export const asObj = (v: Value): Obj => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : {});
export const asStr = (v: Value) => (typeof v === "string" || typeof v === "number" ? String(v) : "");

export const listOptions = (field: FieldDef) =>
  (field.options?.list ?? []).map((o) => (typeof o === "string" ? { title: startCase(o), value: o } : o));

export function isHidden(field: FieldDef, document: Obj, parent: Obj) {
  if (typeof field.hidden === "function") {
    try {
      return field.hidden({ document, parent });
    } catch {
      return false;
    }
  }
  return field.hidden === true;
}
