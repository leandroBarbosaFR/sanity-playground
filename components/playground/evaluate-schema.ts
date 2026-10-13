import { transform } from "sucrase";

export type FieldRules = { required: boolean; min?: number; max?: number };

export type FieldDef = {
  name: string;
  type: string;
  title?: string;
  description?: string;
  group?: string | string[];
  hidden?: boolean | ((ctx: { document: unknown; parent: unknown }) => boolean);
  readOnly?: boolean;
  initialValue?: unknown;
  rows?: number;
  fields?: FieldDef[];
  of?: FieldDef[];
  to?: { type: string }[] | { type: string };
  styles?: { title: string; value: string }[];
  lists?: { title: string; value: string }[];
  options?: {
    list?: (string | { title: string; value: string })[];
    layout?: string;
    direction?: string;
    source?: string;
  };
  rules: FieldRules;
};

export type TypeDef = Omit<FieldDef, "rules"> & {
  groups?: { name: string; title?: string; default?: boolean }[];
};

export type EvaluatedSchema = {
  types: TypeDef[];
  documents: TypeDef[];
};

const sanityStub = {
  defineType: <Definition,>(definition: Definition) => definition,
  defineField: <Definition,>(definition: Definition) => definition,
  defineArrayMember: <Definition,>(definition: Definition) => definition,
};
const iconsStub = new Proxy({}, { get: () => () => null });

function fakeRequire(id: string) {
  if (id === "sanity") return sanityStub;
  if (id === "@sanity/icons" || id.startsWith("@sanity/icons/")) return iconsStub;
  throw new Error(`Only "sanity" and "@sanity/icons" can be imported here (got "${id}")`);
}

function readRules(validation: unknown): FieldRules {
  const rules: FieldRules = { required: false };
  if (typeof validation !== "function") return rules;

  const rule: unknown = new Proxy(
    {},
    {
      get: (_target, method) =>
        (...args: unknown[]) => {
          if (method === "required") rules.required = true;
          if (method === "min" && typeof args[0] === "number") rules.min = args[0];
          if (method === "max" && typeof args[0] === "number") rules.max = args[0];
          return rule;
        },
    },
  );
  try {
    validation(rule);
  } catch {
    // Custom validators may use APIs the stub doesn't model.
  }
  return rules;
}

function normalize(raw: Record<string, unknown>): FieldDef {
  const def = raw as unknown as FieldDef & { validation?: unknown };
  return {
    ...def,
    name: def.name ?? def.type,
    fields: Array.isArray(def.fields) ? def.fields.map((childField) => normalize(childField as never)) : undefined,
    of: Array.isArray(def.of) ? def.of.map((member) => normalize(member as never)) : undefined,
    rules: readRules(def.validation),
  };
}

const isTypeDef = (candidate: unknown): candidate is Record<string, unknown> =>
  typeof candidate === "object" &&
  candidate !== null &&
  typeof (candidate as { name?: unknown }).name === "string" &&
  typeof (candidate as { type?: unknown }).type === "string";

export function evaluateSchema(code: string): EvaluatedSchema {
  const { code: js } = transform(code, { transforms: ["typescript", "imports"] });
  const mod = { exports: {} as Record<string, unknown> };
  new Function("require", "module", "exports", js)(fakeRequire, mod, mod.exports);

  const exported = Object.values(mod.exports).flatMap((exportedValue) => (Array.isArray(exportedValue) ? exportedValue : [exportedValue]));
  const types = exported.filter(isTypeDef).map((typeDef) => normalize(typeDef) as TypeDef);
  if (types.length === 0) {
    throw new Error("Export at least one type, e.g. `export const post = defineType({ ... })`");
  }

  return { types, documents: types.filter((typeDef) => typeDef.type === "document") };
}
