"use client";

import { useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { DocumentIcon } from "@sanity/icons/Document";
import { ImageIcon } from "@sanity/icons/Image";
import { LinkIcon } from "@sanity/icons/Link";
import { TrashIcon } from "@sanity/icons/Trash";
import { UploadIcon } from "@sanity/icons/Upload";
import { Box, Button, Card, Flex, Stack, Text, TextInput } from "@sanity/ui";
import { asObj, asStr, type Value } from "./field-utils";

// The playground isn't connected to a Sanity project, so assets stay in the
// browser: the value keeps Sanity's image/file shape and carries the local
// URL in `_previewUrl` for the form and the preview to display.
export type LocalAsset = {
  _type: "image" | "file";
  asset: { _type: "reference"; _ref: string };
  _previewUrl: string;
  _fileName?: string;
};

export const assetUrl = (value: Value) => asStr(asObj(value)._previewUrl);

function toAsset(kind: "image" | "file", url: string, fileName?: string): LocalAsset {
  return {
    _type: kind,
    asset: { _type: "reference", _ref: `${kind}-local-${crypto.randomUUID().slice(0, 8)}` },
    _previewUrl: url,
    ...(fileName ? { _fileName: fileName } : {}),
  };
}

export function ImageInput({
  kind,
  value,
  onChange,
  disabled,
}: {
  kind: "image" | "file";
  value: Value;
  onChange: (v: Value) => void;
  disabled?: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [urlMode, setUrlMode] = useState(false);
  const [urlDraft, setUrlDraft] = useState("");
  const [error, setError] = useState<string>();

  const current = asObj(value);
  const url = assetUrl(value);

  const replace = (next: LocalAsset | undefined) => {
    if (url.startsWith("blob:")) URL.revokeObjectURL(url);
    // Keep sub-fields like `alt` or `caption` when the asset changes.
    const rest = Object.fromEntries(
      Object.entries(current).filter(([key]) => !["_previewUrl", "asset", "_fileName"].includes(key)),
    );
    onChange(next ? { ...rest, ...next } : Object.keys(rest).length > 1 ? rest : undefined);
  };

  const acceptFile = (file: File | undefined) => {
    if (!file) return;
    if (kind === "image" && !file.type.startsWith("image/")) {
      setError(`"${file.name}" isn't an image`);
      return;
    }
    setError(undefined);
    replace(toAsset(kind, URL.createObjectURL(file), file.name));
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) acceptFile(e.dataTransfer.files[0]);
  };

  const onPaste = (e: ClipboardEvent) => {
    const file = Array.from(e.clipboardData.files)[0];
    if (file && !disabled) {
      e.preventDefault();
      acceptFile(file);
    }
  };

  const submitUrl = () => {
    const trimmed = urlDraft.trim();
    if (!/^https?:\/\//.test(trimmed)) {
      setError("Enter a URL starting with http:// or https://");
      return;
    }
    setError(undefined);
    replace(toAsset(kind, trimmed, trimmed.split("/").pop()));
    setUrlDraft("");
    setUrlMode(false);
  };

  const hiddenInput = (
    <input
      ref={fileInput}
      type="file"
      accept={kind === "image" ? "image/*" : undefined}
      hidden
      onChange={(e) => {
        acceptFile(e.currentTarget.files?.[0]);
        e.currentTarget.value = "";
      }}
    />
  );

  if (url) {
    return (
      <Card border radius={2} overflow="hidden">
        {hiddenInput}
        {kind === "image" ? (
          <Card tone="transparent" style={{ display: "flex", justifyContent: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob/arbitrary URLs can't go through next/image */}
            <img
              src={url}
              alt=""
              style={{ display: "block", maxWidth: "100%", maxHeight: 280, objectFit: "contain" }}
              onError={() => setError("This image couldn't be loaded")}
            />
          </Card>
        ) : (
          <Flex align="center" gap={3} padding={4}>
            <Text size={2} muted>
              <DocumentIcon />
            </Text>
            <Text size={1}>{asStr(current._fileName) || "File"}</Text>
          </Flex>
        )}
        <Card borderTop padding={2}>
          <Flex gap={2} justify="flex-end">
            <Button mode="bleed" icon={UploadIcon} text="Replace" fontSize={1} padding={2} disabled={disabled} onClick={() => fileInput.current?.click()} />
            <Button mode="bleed" tone="critical" icon={TrashIcon} text="Remove" fontSize={1} padding={2} disabled={disabled} onClick={() => replace(undefined)} />
          </Flex>
        </Card>
        {error && (
          <Card tone="critical" padding={2} borderTop>
            <Text size={1}>{error}</Text>
          </Card>
        )}
      </Card>
    );
  }

  return (
    <Stack gap={2}>
      {hiddenInput}
      <Card
        border
        radius={2}
        padding={4}
        tone={dragging ? "primary" : "transparent"}
        style={{ borderStyle: "dashed" }}
        tabIndex={disabled ? undefined : 0}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onPaste={onPaste}
      >
        <Flex align="center" justify="space-between" gap={3} wrap="wrap">
          <Flex align="center" gap={3}>
            <Text muted size={2}>
              {kind === "image" ? <ImageIcon /> : <UploadIcon />}
            </Text>
            <Text size={1} muted>
              Drag or paste {kind} here
            </Text>
          </Flex>
          <Flex gap={2}>
            <Button mode="ghost" icon={UploadIcon} text="Upload" fontSize={1} disabled={disabled} onClick={() => fileInput.current?.click()} />
            <Button mode="ghost" icon={LinkIcon} text="From URL" fontSize={1} disabled={disabled} selected={urlMode} onClick={() => setUrlMode((m) => !m)} />
          </Flex>
        </Flex>
      </Card>
      {urlMode && (
        <Flex gap={2}>
          <Box flex={1}>
            <TextInput
              autoFocus
              type="url"
              placeholder="https://…"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && submitUrl()}
            />
          </Box>
          <Button text="Add" onClick={submitUrl} />
        </Flex>
      )}
      {error && (
        <Text size={1} style={{ color: "var(--card-badge-critical-fg-color, #e5484d)" }}>
          {error}
        </Text>
      )}
    </Stack>
  );
}
