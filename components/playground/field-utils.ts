import type { FieldDef, TypeDef } from "./evaluate-schema";

export type Value = unknown;
export type Obj = Record<string, Value>;
export type Registry = Map<string, TypeDef>;

export const startCase = (text: string) =>
  text.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/^./, (firstLetter) => firstLetter.toUpperCase());

export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);

export const asObj = (value: Value): Obj => (value && typeof value === "object" && !Array.isArray(value) ? (value as Obj) : {});
export const asStr = (value: Value) => (typeof value === "string" || typeof value === "number" ? String(value) : "");

export const listOptions = (field: FieldDef) =>
  (field.options?.list ?? []).map((option) => (typeof option === "string" ? { title: startCase(option), value: option } : option));

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
