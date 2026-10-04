"use client";

import type { ReactNode } from "react";
import { ImageIcon } from "@sanity/icons/Image";
import { LinkIcon } from "@sanity/icons/Link";
import { Badge, Box, Card, Code, Flex, Heading, Inline, Label, Stack, Text } from "@sanity/ui";
import type { FieldDef, TypeDef } from "./evaluate-schema";
import { assetUrl } from "./image-input";
import { asObj, asStr, isHidden, listOptions, startCase, type Obj, type Registry, type Value } from "./field-utils";

const isEmpty = (v: Value) =>
  v === undefined ||
  v === null ||
  v === "" ||
  (Array.isArray(v) && v.length === 0) ||
  (typeof v === "object" && !Array.isArray(v) && Object.keys(v as Obj).filter((k) => !k.startsWith("_")).length === 0);

function formatDate(value: string, withTime: boolean) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, withTime ? { dateStyle: "long", timeStyle: "short" } : { dateStyle: "long" });
}

// Picks the field that reads as the page heading: `title`, then `name`, then the first plain string.
function headingField(fields: FieldDef[]) {
  const plain = fields.filter((f) => f.type === "string" && !f.options?.list);
  return plain.find((f) => f.name === "title") ?? plain.find((f) => f.name === "name") ?? plain[0];
}

function PortableTextPreview({ value }: { value: Value }) {
  const blocks = Array.isArray(value) ? (value as { _key?: string; style?: string; children?: { text?: string }[] }[]) : [];
  return (
    <Stack gap={4}>
      {blocks.map((block, i) => {
        const text = block.children?.map((c) => c.text ?? "").join("") ?? "";
        if (!text) return null;
        if (block.style === "h2") return <Heading key={block._key ?? i} size={2}>{text}</Heading>;
        if (block.style === "h3") return <Heading key={block._key ?? i} size={1}>{text}</Heading>;
        return (
          <Text key={block._key ?? i} size={2} style={{ lineHeight: 1.7 }}>
            {text}
          </Text>
        );
      })}
    </Stack>
  );
}

function ValuePreview({ field, value, registry }: { field: FieldDef; value: Value; registry: Registry }): ReactNode {
  switch (field.type) {
    case "string": {
      const option = listOptions(field).find((o) => o.value === value);
      if (option) return <Badge tone="primary">{option.title}</Badge>;
      return <Text size={2}>{asStr(value)}</Text>;
    }
    case "text":
      return (
        <Text size={2} muted style={{ whiteSpace: "pre-wrap", lineHeight: 1.7 }}>
          {asStr(value)}
        </Text>
      );
    case "number":
      return <Text size={2}>{asStr(value)}</Text>;
    case "boolean":
      return <Badge tone={value ? "positive" : "default"}>{value ? "Yes" : "No"}</Badge>;
    case "slug":
      return <Code size={1}>/{asStr(asObj(value).current)}</Code>;
    case "url":
    case "email":
      return (
        <Text size={2}>
          <a href={field.type === "email" ? `mailto:${asStr(value)}` : asStr(value)} target="_blank" rel="noreferrer">
            {asStr(value)}
          </a>
        </Text>
      );
    case "date":
    case "datetime":
      return <Text size={2}>{formatDate(asStr(value), field.type === "datetime")}</Text>;
    case "image":
    case "file": {
      const url = assetUrl(value);
      const meta = asObj(value);
      const caption = asStr(meta.caption);
      if (field.type === "file") {
        return (
          <Text size={2}>
            <a href={url} target="_blank" rel="noreferrer">
              {asStr(meta._fileName) || "Download file"}
            </a>
          </Text>
        );
      }
      return (
        <Stack gap={2} as="figure" style={{ margin: 0 }}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob/arbitrary URLs can't go through next/image
            <img src={url} alt={asStr(meta.alt)} style={{ display: "block", width: "100%", borderRadius: 6 }} />
          ) : (
            <Card radius={3} tone="transparent" border style={{ aspectRatio: "16 / 9" }}>
              <Flex align="center" justify="center" height="fill" padding={5}>
                <Text muted size={3}>
                  <ImageIcon />
                </Text>
              </Flex>
            </Card>
          )}
          {caption && (
            <Text as="figcaption" size={1} muted>
              {caption}
            </Text>
          )}
        </Stack>
      );
    }
    case "reference":
      return (
        <Inline gap={2}>
          <Text size={1} muted>
            <LinkIcon />
          </Text>
          <Text size={1}>{asStr(asObj(value)._ref)}</Text>
        </Inline>
      );
    case "array": {
      if (field.of?.some((m) => m.type === "block")) return <PortableTextPreview value={value} />;
      const items = Array.isArray(value) ? value : [];
      if (items.every((it) => typeof it !== "object")) {
        return (
          <Inline gap={2}>
            {items.filter((it) => asStr(it)).map((it, i) => (
              <Badge key={i}>{asStr(it)}</Badge>
            ))}
          </Inline>
        );
      }
      return (
        <Stack gap={3}>
          {items.map((item, i) => {
            const t = asObj(item)._type;
            const member = field.of?.find((m) => m.name === t || m.type === t) ?? field.of?.[0];
            const fields = member?.fields ?? (member && registry.get(member.type)?.fields) ?? [];
            return (
              <Card key={asStr(asObj(item)._key) || i} border radius={2} padding={4}>
                <FieldsPreview fields={fields} value={asObj(item)} document={asObj(item)} registry={registry} />
              </Card>
            );
          })}
        </Stack>
      );
    }
    default: {
      const fields = field.fields ?? registry.get(field.type)?.fields;
      if (!fields) return <Code size={1}>{JSON.stringify(value)}</Code>;
      return (
        <Card border radius={2} padding={4} tone="transparent">
          <FieldsPreview fields={fields} value={asObj(value)} document={asObj(value)} registry={registry} />
        </Card>
      );
    }
  }
}

function FieldsPreview({ fields, value, document, registry }: { fields: FieldDef[]; value: Obj; document: Obj; registry: Registry }) {
  const visible = fields.filter((f) => !isHidden(f, document, value) && !isEmpty(value[f.name]));
  if (visible.length === 0) return null;
  return (
    <Stack gap={5}>
      {visible.map((field) => (
        <Stack key={field.name} gap={3}>
          <Label size={1} muted>
            {field.title ?? startCase(field.name)}
          </Label>
          <ValuePreview field={field} value={value[field.name]} registry={registry} />
        </Stack>
      ))}
    </Stack>
  );
}

export function DocumentPreview({ type, types, value }: { type: TypeDef; types: TypeDef[]; value: Obj }) {
  const registry: Registry = new Map(types.map((t) => [t.name, t]));
  const fields = (type.fields ?? []).filter((f) => !isHidden(f, value, value));
  const heading = headingField(fields);
  const title = heading ? asStr(value[heading.name]) : "";
  const rest = fields.filter((f) => f !== heading);
  const hasContent = fields.some((f) => !isEmpty(value[f.name]));

  if (!hasContent) {
    return (
      <Card border radius={3} padding={5} tone="transparent" style={{ borderStyle: "dashed" }}>
        <Stack gap={3}>
          <Text size={2} weight="medium" align="center">
            Nothing to preview yet
          </Text>
          <Text size={1} muted align="center">
            Fill in the form and your content shows up here.
          </Text>
        </Stack>
      </Card>
    );
  }

  return (
    <Card as="article" radius={3} shadow={1} padding={[4, 5, 6]}>
      <Stack gap={6}>
        <Stack gap={3}>
          <Label size={1} muted>
            {type.title ?? startCase(type.name)}
          </Label>
          <Heading size={4} style={{ lineHeight: 1.2 }}>
            {title || `Untitled ${type.title ?? startCase(type.name)}`}
          </Heading>
        </Stack>
        <Box>
          <FieldsPreview fields={rest} value={value} document={value} registry={registry} />
        </Box>
      </Stack>
    </Card>
  );
}
