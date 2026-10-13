# Sanity Playground

**Build, preview, and explore Sanity schemas directly in your browser.**

[Visit Sanity Playground](https://www.sanity-playground.com/)

## What is Sanity Playground?

Sanity Playground is an interactive environment designed to make exploring and experimenting with Sanity easier.

Whether you're a developer learning Sanity, an experienced user testing schema ideas, or someone introducing Sanity to a team or client, Sanity Playground provides a simple way to demonstrate how Sanity Studio works.

Write your schema on one side and instantly see a Sanity-style form preview on the other. This is a lightweight approximation, not Sanity Studio's native form engine.

No project setup required.

## Features

- **Interactive Schema Editor:** Write and experiment with Sanity schemas directly in your browser.
- **Live Form Preview:** See a Studio-style form for your schema, built with Sanity UI, update as you type.
- **Rapid Prototyping:** Test content structures and experiment with field configurations before implementing them in your project.
- **Learning and Demonstrations:** Introduce Sanity to colleagues, clients, and newcomers through a hands-on experience.
- **No Setup Required:** Explore Sanity without creating a project or configuring a local development environment.
- **Custom Previews:** Write a React component and preview your document with it.
- **Saved Locally:** Your schema and component are kept in your browser's local storage. Nothing is sent to a server.

## Who is it for?

**Developers:** Experiment with schemas and validate content modelling ideas.

**Beginners:** Discover how Sanity schemas work through a practical, visual experience.

**Agencies and Teams:** Demonstrate Sanity's flexibility to clients and colleagues without building a complete project.

## Getting Started

1. Visit [sanity-playground.com](https://www.sanity-playground.com/).
2. Write or modify a Sanity schema in the editor.
3. See the corresponding Studio form in the live preview.
4. Experiment with different fields and content structures.

## Run locally

```bash
git clone https://github.com/leandroBarbosaFR/sanity-playground.git
cd sanity-playground
npm install
```

Create `.env.local` (needed only by the embedded Studio at `/studio`; any valid-looking values work for the playground itself):

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

Then run `npm run dev` and open http://localhost:3000.

## How it works

Everything runs in the browser; there is no backend.

- `components/playground/evaluate-schema.ts` compiles the schema with Sucrase, runs it with a small `require` shim that provides `defineType`, `defineField` and `defineArrayMember`, and normalizes the result into field definitions.
- `components/playground/schema-form.tsx` renders those definitions as a Studio-style form using `@sanity/ui`. This is a hand-built approximation, not Sanity's form builder.
- `components/playground/evaluate-component.tsx` compiles the custom preview component the same way and renders it with the current document data.
- `components/playground/schema-playground.tsx` wires up the editors, the Form / JSON / Preview views, and local storage.

## Built With

- Next.js
- React
- TypeScript
- Sanity UI (`@sanity/ui`)
- CodeMirror
- Sucrase

## Current Limitations

The preview supports a subset of schema features. Portable Text is presented as simplified plain-text editing, references use a manual identifier input, and advanced validation or custom input components are not fully simulated. Avoid pasting secrets into the playground. Your code runs in your own browser, in the playground's page, with no backend.

## Feedback and Contributions

Sanity Playground is an independent project built for the Sanity developer community.

Feedback, suggestions, and contributions are welcome.

[View the GitHub Repository](https://github.com/leandroBarbosaFR/sanity-playground)

## Disclaimer

Sanity Playground is an independent community tool and is not an official Sanity product.
