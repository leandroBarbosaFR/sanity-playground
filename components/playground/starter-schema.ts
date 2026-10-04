export const STARTER_SCHEMA = `import { defineArrayMember, defineField, defineType } from "sanity";
import { DocumentTextIcon } from "@sanity/icons/DocumentText";

export const post = defineType({
  name: "post",
  title: "Post",
  type: "document",
  icon: DocumentTextIcon,
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "meta", title: "Meta" },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "title",
      type: "string",
      group: "content",
      validation: (rule) => rule.required().max(80),
    }),
    defineField({
      name: "slug",
      type: "slug",
      group: "content",
      options: { source: "title", maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "excerpt",
      type: "text",
      rows: 3,
      group: "content",
      description: "Shown on cards and in search results.",
    }),
    defineField({
      name: "mainImage",
      type: "image",
      group: "content",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alternative text", type: "string" }),
        defineField({ name: "caption", type: "string" }),
      ],
    }),
    defineField({
      name: "body",
      type: "array",
      group: "content",
      of: [defineArrayMember({ type: "block" })],
    }),
    defineField({
      name: "category",
      type: "string",
      group: "meta",
      options: {
        list: ["engineering", "design", "product"],
        layout: "radio",
        direction: "horizontal",
      },
    }),
    defineField({
      name: "author",
      type: "reference",
      to: [{ type: "author" }],
      group: "meta",
    }),
    defineField({ name: "publishedAt", type: "datetime", group: "meta" }),
    defineField({ name: "featured", type: "boolean", group: "meta", initialValue: false }),
    defineField({
      name: "tags",
      type: "array",
      group: "meta",
      of: [defineArrayMember({ type: "string" })],
    }),
    defineField({ name: "seo", type: "seo", group: "seo" }),
  ],
});

export const seo = defineType({
  name: "seo",
  title: "SEO",
  type: "object",
  fields: [
    defineField({ name: "metaTitle", type: "string", validation: (rule) => rule.max(60) }),
    defineField({ name: "metaDescription", type: "text", rows: 2, validation: (rule) => rule.max(160) }),
    defineField({ name: "noIndex", title: "Hide from search engines", type: "boolean" }),
  ],
});
`;
