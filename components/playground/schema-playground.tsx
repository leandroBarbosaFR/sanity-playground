"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";
import { CodeIcon } from "@sanity/icons/Code";
import { DocumentIcon } from "@sanity/icons/Document";
import { ErrorOutlineIcon } from "@sanity/icons/ErrorOutline";
import { PublishIcon } from "@sanity/icons/Publish";
import { ResetIcon } from "@sanity/icons/Reset";
import { Badge, Box, Button, Card, Code, Flex, Select, Spinner, Stack, Tab, TabList, Text, ThemeProvider, studioTheme } from "@sanity/ui";
import { DocumentPreview } from "./document-preview";
import { PreviewErrorBoundary, evaluateComponent, urlFor } from "./evaluate-component";
import { evaluateSchema, type EvaluatedSchema } from "./evaluate-schema";
import { SchemaForm } from "./schema-form";
import { STARTER_COMPONENT } from "./starter-component";
import { STARTER_SCHEMA } from "./starter-schema";

const STORAGE = {
  schema: "schema-playground:code",
  component: "schema-playground:component",
  savedComponent: "schema-playground:component-saved",
};

const FILES = [
  { id: "schema", name: "schema.ts" },
  { id: "component", name: "component.tsx" },
] as const;
type FileId = (typeof FILES)[number]["id"];

const VIEWS = [
  { id: "form", label: "Form" },
  { id: "preview", label: "Preview" },
  { id: "json", label: "JSON" },
] as const;
type View = (typeof VIEWS)[number]["id"];

function readStored(key: string, fallback: string) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable (private mode); the editor still works.
  }
}

function useDebounced<T>(value: T, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

const errorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export function SchemaPlayground() {
  const [code, setCode] = useState(() => readStored(STORAGE.schema, STARTER_SCHEMA));
  const [componentCode, setComponentCode] = useState(() => readStored(STORAGE.component, STARTER_COMPONENT));
  const [savedComponent, setSavedComponent] = useState(() => readStored(STORAGE.savedComponent, STARTER_COMPONENT));
  const [activeFile, setActiveFile] = useState<FileId>("schema");
  const [values, setValues] = useState<Record<string, Record<string, unknown>>>({});
  const [selectedType, setSelectedType] = useState<string>();
  const [view, setView] = useState<View>("form");
  const [previewMode, setPreviewMode] = useState<"component" | "generic">("component");
  const debouncedCode = useDebounced(code, 250);
  const debouncedComponent = useDebounced(componentCode, 250);

  useEffect(() => writeStored(STORAGE.schema, debouncedCode), [debouncedCode]);
  useEffect(() => writeStored(STORAGE.component, debouncedComponent), [debouncedComponent]);
  useEffect(() => writeStored(STORAGE.savedComponent, savedComponent), [savedComponent]);

  // Keep rendering the last schema that evaluated cleanly while the user types.
  const [lastGood, setLastGood] = useState<EvaluatedSchema>();
  const result = useMemo(() => {
    try {
      return { schema: evaluateSchema(debouncedCode), error: undefined };
    } catch (err) {
      return { schema: undefined, error: errorMessage(err) };
    }
  }, [debouncedCode]);
  if (result.schema && result.schema !== lastGood) setLastGood(result.schema);
  const schema = result.schema ?? lastGood;

  // The component only changes on save, so a half-typed edit never breaks the preview.
  const compiled = useMemo(() => {
    try {
      return { Preview: evaluateComponent(savedComponent), error: undefined };
    } catch (err) {
      return { Preview: undefined, error: errorMessage(err) };
    }
  }, [savedComponent]);

  const candidates = schema ? (schema.documents.length > 0 ? schema.documents : schema.types) : [];
  const type = candidates.find((t) => t.name === selectedType) ?? candidates[0];
  const docValue = useMemo(() => (type ? values[type.name] ?? {} : {}), [type, values]);
  const data = useMemo(() => ({ _type: type?.name, ...docValue }), [type, docValue]);
  const boundaryKey = useMemo(() => ({ Preview: compiled.Preview, data }), [compiled.Preview, data]);

  const unsaved = componentCode !== savedComponent;

  const save = () => {
    setSavedComponent(componentCode);
    setPreviewMode("component");
    setView("preview");
  };
  const schemaExtensions = useMemo(() => [javascript({ typescript: true })], []);
  const componentExtensions = useMemo(() => [javascript({ typescript: true, jsx: true })], []);

  const editorError = activeFile === "schema" ? result.error : compiled.error;

  const reset = () => {
    if (activeFile === "schema") {
      setCode(STARTER_SCHEMA);
      setValues({});
    } else {
      setComponentCode(STARTER_COMPONENT);
      setSavedComponent(STARTER_COMPONENT);
    }
  };

  return (
    <ThemeProvider theme={studioTheme}>
      <div className="grid h-dvh grid-cols-1 lg:grid-cols-2 h-full bg-default-100">
        <Card scheme="dark" className="flex min-h-0 flex-col" style={{ minHeight: "50dvh" }}>
          <Card scheme="dark" borderBottom paddingX={3} paddingY={2}>
            <Flex align="center" justify="space-between" gap={2}>
              <TabList gap={1}>
                {FILES.map((f) => (
                  <Tab
                    key={f.id}
                    id={`file-${f.id}`}
                    aria-controls={`editor-${f.id}`}
                    icon={CodeIcon}
                    label={f.id === "component" && unsaved ? `${f.name} ●` : f.name}
                    fontSize={1}
                    padding={2}
                    selected={activeFile === f.id}
                    onClick={() => setActiveFile(f.id)}
                  />
                ))}
              </TabList>
              <Flex gap={1}>
                {activeFile === "component" && (
                  <Button
                    mode={unsaved ? "default" : "bleed"}
                    tone="primary"
                    text="Save ⌘S"
                    fontSize={1}
                    padding={2}
                    disabled={!unsaved}
                    onClick={save}
                  />
                )}
                <Button mode="bleed" icon={ResetIcon} text="Reset" fontSize={1} padding={2} onClick={reset} />
              </Flex>
            </Flex>
          </Card>
          <Box id="editor-schema" flex={1} hidden={activeFile !== "schema"} style={{ minHeight: 0, overflow: "auto" }}>
            <CodeMirror
              value={code}
              onChange={setCode}
              theme="dark"
              height="100%"
              style={{ height: "100%", fontSize: 13 }}
              extensions={schemaExtensions}
              basicSetup={{ foldGutter: true, highlightActiveLine: true }}
            />
          </Box>
          <Box
            id="editor-component"
            flex={1}
            hidden={activeFile !== "component"}
            style={{ minHeight: 0, overflow: "auto" }}
            onKeyDownCapture={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
                e.preventDefault();
                save();
              }
            }}
          >
            <CodeMirror
              value={componentCode}
              onChange={setComponentCode}
              theme="dark"
              height="100%"
              style={{ height: "100%", fontSize: 13 }}
              extensions={componentExtensions}
              basicSetup={{ foldGutter: true, highlightActiveLine: true }}
            />
          </Box>
          {editorError && (
            <Card tone="critical" padding={3} borderTop>
              <Flex gap={2} align="flex-start">
                <Text size={1}>
                  <ErrorOutlineIcon />
                </Text>
                <Text size={1}>{editorError}</Text>
              </Flex>
            </Card>
          )}
        </Card>

        <Card tone="default" className="flex min-h-0 flex-col" borderLeft>
          <Card borderBottom paddingX={4} paddingY={3}>
            <Flex align="center" justify="space-between" gap={3}>
              <Flex align="center" gap={3}>
                <Text size={2}>
                  <DocumentIcon />
                </Text>
                {candidates.length > 1 ? (
                  <Select fontSize={1} padding={2} value={type?.name} onChange={(e) => setSelectedType(e.currentTarget.value)}>
                    {candidates.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.title ?? t.name}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Text size={2} weight="semibold">
                    {type?.title ?? type?.name ?? "No type"}
                  </Text>
                )}
                {type && (
                  <Badge tone={type.type === "document" ? "primary" : "default"} fontSize={0}>
                    {type.type}
                  </Badge>
                )}
              </Flex>
              <Flex gap={2}>
                <TabList gap={1}>
                  {VIEWS.map((v) => (
                    <Tab
                      key={v.id}
                      id={`view-${v.id}`}
                      aria-controls="playground-view"
                      label={v.label}
                      fontSize={1}
                      padding={2}
                      selected={view === v.id}
                      onClick={() => setView(v.id)}
                    />
                  ))}
                </TabList>
                <Button tone="positive" icon={PublishIcon} text="Publish" fontSize={1} padding={2} disabled />
              </Flex>
            </Flex>
          </Card>
          {view === "preview" && (
            <Card borderBottom paddingX={4} paddingY={2} tone="transparent">
              <Flex align="center" justify="space-between" gap={2}>
                <Flex gap={1}>
                  <Button
                    mode="bleed"
                    text="component.tsx"
                    fontSize={1}
                    padding={2}
                    selected={previewMode === "component"}
                    onClick={() => setPreviewMode("component")}
                  />
                  <Button
                    mode="bleed"
                    text="Generic"
                    fontSize={1}
                    padding={2}
                    selected={previewMode === "generic"}
                    onClick={() => setPreviewMode("generic")}
                  />
                </Flex>
                {previewMode === "component" && unsaved && (
                  <Text size={1} muted>
                    Unsaved changes in component.tsx
                  </Text>
                )}
              </Flex>
            </Card>
          )}
          <Card
            id="playground-view"
            flex={1}
            padding={[4, 5]}
            tone={view === "preview" ? "transparent" : "default"}
            style={{ minHeight: 0, overflow: "auto" }}
          >
            {!type ? (
              <Text muted size={1}>
                Export a type from the editor to see its form.
              </Text>
            ) : view === "json" ? (
              <Card padding={3} radius={2} tone="transparent" border>
                <Code language="json" size={1}>
                  {JSON.stringify(data, null, 2)}
                </Code>
              </Card>
            ) : view === "preview" ? (
              <Box style={{ maxWidth: 720, margin: "0 auto" }}>
                {previewMode === "generic" ? (
                  <DocumentPreview type={type} types={schema?.types ?? []} value={docValue} />
                ) : compiled.Preview ? (
                  <PreviewErrorBoundary
                    resetKey={boundaryKey}
                    fallback={(error) => (
                      <Card tone="critical" padding={4} radius={2} border>
                        <Stack gap={3}>
                          <Text size={1} weight="semibold">
                            component.tsx crashed while rendering
                          </Text>
                          <Code size={1}>{error.message}</Code>
                        </Stack>
                      </Card>
                    )}
                  >
                    {/* Icons imported by component.tsx load lazily. */}
                    <Suspense
                      fallback={
                        <Flex justify="center" padding={5}>
                          <Spinner muted />
                        </Flex>
                      }
                    >
                      <compiled.Preview data={data} urlFor={urlFor} />
                    </Suspense>
                  </PreviewErrorBoundary>
                ) : (
                  <Card tone="critical" padding={4} radius={2} border>
                    <Text size={1}>component.tsx has an error. Fix it in the editor and save again.</Text>
                  </Card>
                )}
              </Box>
            ) : (
              <Stack gap={5} style={{ maxWidth: 640, margin: "0 auto" }}>
                <SchemaForm
                  key={type.name}
                  type={type}
                  types={schema?.types ?? []}
                  value={docValue}
                  onChange={(next) => setValues((all) => ({ ...all, [type.name]: next }))}
                />
              </Stack>
            )}
          </Card>
        </Card>
      </div>
    </ThemeProvider>
  );
}
