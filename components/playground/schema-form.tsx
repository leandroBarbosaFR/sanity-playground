"use client";

import { useState, type ReactNode } from "react";
import { AddIcon } from "@sanity/icons/Add";
import { BoldIcon } from "@sanity/icons/Bold";
import { ItalicIcon } from "@sanity/icons/Italic";
import { LinkIcon } from "@sanity/icons/Link";
import { OlistIcon } from "@sanity/icons/Olist";
import { SearchIcon } from "@sanity/icons/Search";
import { TrashIcon } from "@sanity/icons/Trash";
import { UlistIcon } from "@sanity/icons/Ulist";
import {
  Box,
  Button,
  Card,
  Checkbox,
  Flex,
  Radio,
  Select,
  Stack,
  Switch,
  Tab,
  TabList,
  Text,
  TextArea,
  TextInput,
} from "@sanity/ui";
import type { FieldDef, TypeDef } from "./evaluate-schema";
import { ImageInput, assetUrl } from "./image-input";
import { asObj, asStr, isHidden, listOptions, slugify, startCase, type Obj, type Registry, type Value } from "./field-utils";

function validationMessage(field: FieldDef, value: Value) {
  const { required, min, max } = field.rules;
  const empty = value === undefined || value === "" || (Array.isArray(value) && value.length === 0);
  if (required && empty) return "Required";
  const length = typeof value === "string" || Array.isArray(value) ? value.length : undefined;
  if (length !== undefined && max !== undefined && length > max) return `Must be at most ${max} ${typeof value === "string" ? "characters" : "items"}`;
  if (length !== undefined && min !== undefined && length > 0 && length < min) return `Must be at least ${min} ${typeof value === "string" ? "characters" : "items"}`;
  return undefined;
}

type FieldProps = {
  field: FieldDef;
  value: Value;
  onChange: (v: Value) => void;
  document: Obj;
  parent: Obj;
  registry: Registry;
};

function FieldShell({ field, value, children }: { field: FieldDef; value: Value; children: ReactNode }) {
  const message = validationMessage(field, value);
  return (
    <Stack gap={3}>
      <Stack gap={2}>
        <Flex align="center" gap={2}>
          <Text size={1} weight="medium">
            {field.title ?? startCase(field.name)}
          </Text>
          {field.rules.required && (
            <Text size={1} muted>
              *
            </Text>
          )}
        </Flex>
        {field.description && (
          <Text size={1} muted>
            {field.description}
          </Text>
        )}
      </Stack>
      {children}
      {message && (
        <Text size={1} style={{ color: "var(--card-badge-critical-fg-color, #e5484d)" }}>
          {message}
        </Text>
      )}
    </Stack>
  );
}

function FieldInput({ field, value, onChange, document, registry }: FieldProps) {
  const id = `field-${field.name}`;
  const disabled = field.readOnly === true;

  switch (field.type) {
    case "string": {
      const options = listOptions(field);
      if (options.length > 0 && field.options?.layout === "radio") {
        return (
          <Flex gap={4} direction={field.options.direction === "horizontal" ? "row" : "column"} wrap="wrap">
            {options.map((o) => (
              <Flex key={o.value} as="label" align="center" gap={2}>
                <Radio
                  name={id}
                  checked={value === o.value}
                  onChange={() => onChange(o.value)}
                  disabled={disabled}
                />
                <Text size={1}>{o.title}</Text>
              </Flex>
            ))}
          </Flex>
        );
      }
      if (options.length > 0) {
        return (
          <Select id={id} value={asStr(value)} onChange={(e) => onChange(e.currentTarget.value || undefined)} disabled={disabled}>
            <option value="">Select…</option>
            {options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.title}
              </option>
            ))}
          </Select>
        );
      }
      return <TextInput id={id} value={asStr(value)} onChange={(e) => onChange(e.currentTarget.value)} readOnly={disabled} />;
    }

    case "text":
      return (
        <TextArea
          id={id}
          rows={field.rows ?? 10}
          value={asStr(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          readOnly={disabled}
        />
      );

    case "number":
      return (
        <TextInput
          id={id}
          type="number"
          value={asStr(value)}
          onChange={(e) => onChange(e.currentTarget.value === "" ? undefined : Number(e.currentTarget.value))}
          readOnly={disabled}
        />
      );

    case "url":
    case "email":
      return (
        <TextInput
          id={id}
          type={field.type}
          icon={field.type === "url" ? LinkIcon : undefined}
          value={asStr(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          readOnly={disabled}
        />
      );

    case "date":
    case "datetime":
      return (
        <TextInput
          id={id}
          type={field.type === "date" ? "date" : "datetime-local"}
          value={asStr(value)}
          onChange={(e) => onChange(e.currentTarget.value)}
          readOnly={disabled}
        />
      );

    case "boolean":
      return (
        <Flex as="label" align="center" gap={3}>
          {field.options?.layout === "checkbox" ? (
            <Checkbox checked={value === true} onChange={(e) => onChange(e.currentTarget.checked)} disabled={disabled} />
          ) : (
            <Switch checked={value === true} onChange={(e) => onChange(e.currentTarget.checked)} disabled={disabled} />
          )}
          <Text size={1} muted>
            {value === true ? "On" : "Off"}
          </Text>
        </Flex>
      );

    case "slug": {
      const source = field.options?.source;
      const current = asStr(asObj(value).current);
      return (
        <Flex gap={2}>
          <Box flex={1}>
            <TextInput
              id={id}
              value={current}
              onChange={(e) => onChange({ _type: "slug", current: e.currentTarget.value })}
              readOnly={disabled}
            />
          </Box>
          {source && (
            <Button
              mode="ghost"
              text="Generate"
              disabled={disabled}
              onClick={() => onChange({ _type: "slug", current: slugify(asStr(document[source])) })}
            />
          )}
        </Flex>
      );
    }

    case "image":
    case "file":
      return (
        <Stack gap={4}>
          <ImageInput kind={field.type} value={value} onChange={onChange} disabled={disabled} />
          {field.fields && field.fields.length > 0 && assetUrl(value) && (
            <Card borderLeft paddingLeft={4}>
              <FieldList fields={field.fields} value={asObj(value)} onChange={onChange} document={document} registry={registry} />
            </Card>
          )}
        </Stack>
      );

    case "reference": {
      const targets = (Array.isArray(field.to) ? field.to : field.to ? [field.to] : []).map((t) => t.type);
      return (
        <TextInput
          id={id}
          icon={SearchIcon}
          placeholder={`Search for ${targets.join(", ") || "documents"}…`}
          value={asStr(asObj(value)._ref)}
          onChange={(e) => onChange(e.currentTarget.value ? { _type: "reference", _ref: e.currentTarget.value } : undefined)}
          readOnly={disabled}
        />
      );
    }

    case "object":
      return (
        <Card border radius={2} padding={4}>
          <FieldList fields={field.fields ?? []} value={asObj(value)} onChange={onChange} document={document} registry={registry} />
        </Card>
      );

    case "array":
      return <ArrayInput field={field} value={value} onChange={onChange} document={document} registry={registry} />;

    default: {
      // A type exported elsewhere in the editor (e.g. a shared `seo` object).
      const named = registry.get(field.type);
      if (named?.fields) {
        return (
          <Card border radius={2} padding={4}>
            <FieldList fields={named.fields} value={asObj(value)} onChange={onChange} document={document} registry={registry} />
          </Card>
        );
      }
      return (
        <Card tone="caution" border radius={2} padding={3}>
          <Text size={1}>
            Unknown type <code>{field.type}</code>. Export it from the editor to preview it.
          </Text>
        </Card>
      );
    }
  }
}

function PortableTextInput({ field, value, onChange }: { field: FieldDef; value: Value; onChange: (v: Value) => void }) {
  const block = field.of?.find((m) => m.type === "block");
  const styles = block?.styles ?? [{ title: "Normal", value: "normal" }, { title: "Heading 2", value: "h2" }, { title: "Heading 3", value: "h3" }, { title: "Quote", value: "blockquote" }];
  const lists = block?.lists ?? [{ title: "Bullet", value: "bullet" }, { title: "Numbered", value: "number" }];
  const blocks = Array.isArray(value) ? (value as { children?: { text?: string }[] }[]) : [];
  const text = blocks.map((b) => b.children?.map((c) => c.text ?? "").join("") ?? "").join("\n\n");

  return (
    <Card border radius={2} overflow="hidden">
      <Card borderBottom padding={1} tone="transparent">
        <Flex gap={1} align="center" wrap="wrap">
          <Box style={{ width: 140 }}>
            <Select fontSize={1} padding={2} defaultValue={styles[0]?.value}>
              {styles.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.title}
                </option>
              ))}
            </Select>
          </Box>
          <Button mode="bleed" icon={BoldIcon} fontSize={1} padding={2} aria-label="Bold" />
          <Button mode="bleed" icon={ItalicIcon} fontSize={1} padding={2} aria-label="Italic" />
          {lists.some((l) => l.value === "bullet") && <Button mode="bleed" icon={UlistIcon} fontSize={1} padding={2} aria-label="Bullet list" />}
          {lists.some((l) => l.value === "number") && <Button mode="bleed" icon={OlistIcon} fontSize={1} padding={2} aria-label="Numbered list" />}
          <Button mode="bleed" icon={LinkIcon} fontSize={1} padding={2} aria-label="Link" />
        </Flex>
      </Card>
      <TextArea
        border={false}
        rows={6}
        placeholder="Empty"
        value={text}
        onChange={(e) =>
          onChange(
            e.currentTarget.value.split(/\n{2,}/).map((para, i) => ({
              _type: "block",
              _key: `b${i}`,
              style: "normal",
              markDefs: [],
              children: [{ _type: "span", _key: `s${i}`, text: para, marks: [] }],
            })),
          )
        }
      />
    </Card>
  );
}

function ArrayInput({ field, value, onChange, document, registry }: Omit<FieldProps, "parent">) {
  const members = field.of ?? [];
  if (members.some((m) => m.type === "block")) {
    return <PortableTextInput field={field} value={value} onChange={onChange} />;
  }

  const items = Array.isArray(value) ? value : [];
  const memberFor = (item: Value) => {
    const t = asObj(item)._type;
    return members.find((m) => m.name === t || m.type === t) ?? members[0];
  };
  const update = (index: number, next: Value) => onChange(items.map((it, i) => (i === index ? next : it)));
  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = (member: FieldDef) => {
    const isObject = member.type === "object" || registry.get(member.type)?.fields || member.fields;
    const key = crypto.randomUUID().slice(0, 8);
    onChange([...items, isObject ? { _key: key, _type: member.name ?? member.type } : ""]);
  };

  return (
    <Stack gap={2}>
      {items.length === 0 && (
        <Card border radius={2} padding={3} tone="transparent">
          <Text size={1} muted align="center">
            No items
          </Text>
        </Card>
      )}
      {items.map((item, index) => {
        const member = memberFor(item);
        if (!member) return null;
        return (
          <Card key={asStr(asObj(item)._key) || index} border radius={2} padding={3}>
            <Flex gap={2} align="flex-start">
              <Box flex={1}>
                <FieldInput
                  field={{ ...member, name: `${field.name}-${index}` }}
                  value={item}
                  onChange={(next) =>
                    update(index, typeof item === "object" && item ? { ...asObj(next), _key: asObj(item)._key, _type: asObj(item)._type } : next)
                  }
                  document={document}
                  parent={asObj(item)}
                  registry={registry}
                />
              </Box>
              <Button mode="bleed" tone="critical" icon={TrashIcon} aria-label="Remove item" onClick={() => remove(index)} />
            </Flex>
          </Card>
        );
      })}
      <Flex gap={2} wrap="wrap">
        {members.map((m) => (
          <Button
            key={m.name ?? m.type}
            mode="ghost"
            icon={AddIcon}
            text={members.length > 1 ? `Add ${m.title ?? startCase(m.name ?? m.type)}` : "Add item"}
            fontSize={1}
            onClick={() => add(m)}
            style={{ flex: members.length > 1 ? undefined : 1 }}
          />
        ))}
      </Flex>
    </Stack>
  );
}

function FieldList({
  fields,
  value,
  onChange,
  document,
  registry,
}: {
  fields: FieldDef[];
  value: Obj;
  onChange: (v: Obj) => void;
  document: Obj;
  registry: Registry;
}) {
  return (
    <Stack gap={5}>
      {fields
        .filter((f) => !isHidden(f, document, value))
        .map((field) => {
          const fieldValue = value[field.name] ?? (typeof field.initialValue !== "function" ? field.initialValue : undefined);
          return (
            <FieldShell key={field.name} field={field} value={fieldValue}>
              <FieldInput
                field={field}
                value={fieldValue}
                onChange={(next) => onChange({ ...value, [field.name]: next })}
                document={document}
                parent={value}
                registry={registry}
              />
            </FieldShell>
          );
        })}
    </Stack>
  );
}

const inGroup = (field: FieldDef, group: string) =>
  Array.isArray(field.group) ? field.group.includes(group) : field.group === group;

export function SchemaForm({
  type,
  types,
  value,
  onChange,
}: {
  type: TypeDef;
  types: TypeDef[];
  value: Obj;
  onChange: (v: Obj) => void;
}) {
  const registry: Registry = new Map(types.map((t) => [t.name, t]));
  const groups = type.groups ?? [];
  const defaultGroup = groups.find((g) => g.default)?.name ?? "all";
  const [activeGroup, setActiveGroup] = useState<string | undefined>(undefined);
  const current = activeGroup && (activeGroup === "all" || groups.some((g) => g.name === activeGroup)) ? activeGroup : defaultGroup;

  const fields = (type.fields ?? []).filter((f) => current === "all" || inGroup(f, current));

  return (
    <Stack gap={5}>
      {groups.length > 0 && (
        <TabList gap={1}>
          {[{ name: "all", title: "All fields" }, ...groups].map((g) => (
            <Tab
              key={g.name}
              id={`tab-${g.name}`}
              aria-controls="schema-form-panel"
              label={g.title ?? startCase(g.name)}
              selected={current === g.name}
              onClick={() => setActiveGroup(g.name)}
            />
          ))}
        </TabList>
      )}
      <div id="schema-form-panel">
        <FieldList fields={fields} value={value} onChange={onChange} document={value} registry={registry} />
      </div>
    </Stack>
  );
}
