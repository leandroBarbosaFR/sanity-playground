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

// The playground evaluates code the user typed in their own browser, so
// `sanity` and `@sanity/icons` are stubbed: define* helpers are identities
// and every icon resolves to the same placeholder.
const sanityStub = {
  defineType: <T,>(def: T) => def,
  defineField: <T,>(def: T) => def,
  defineArrayMember: <T,>(def: T) => def,
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
      get: (_, method) =>
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
    // Custom validators may touch APIs the stub doesn't model; ignore them.
  }
  return rules;
}

function normalize(raw: Record<string, unknown>): FieldDef {
  const def = raw as unknown as FieldDef & { validation?: unknown };
  return {
    ...def,
    name: def.name ?? def.type,
    fields: Array.isArray(def.fields) ? def.fields.map((f) => normalize(f as never)) : undefined,
    of: Array.isArray(def.of) ? def.of.map((f) => normalize(f as never)) : undefined,
    rules: readRules(def.validation),
  };
}

const isTypeDef = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" &&
  v !== null &&
  typeof (v as { name?: unknown }).name === "string" &&
  typeof (v as { type?: unknown }).type === "string";

export function evaluateSchema(code: string): EvaluatedSchema {
  const { code: js } = transform(code, { transforms: ["typescript", "imports"] });
  const mod = { exports: {} as Record<string, unknown> };
  new Function("require", "module", "exports", js)(fakeRequire, mod, mod.exports);

  const exported = Object.values(mod.exports).flatMap((v) => (Array.isArray(v) ? v : [v]));
  const types = exported.filter(isTypeDef).map((t) => normalize(t) as TypeDef);
  if (types.length === 0) {
    throw new Error("Export at least one type, e.g. `export const post = defineType({ ... })`");
  }

  return { types, documents: types.filter((t) => t.type === "document") };
}
