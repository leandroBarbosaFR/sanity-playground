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
- **Live Studio Preview:** See how your schema fields appear inside Sanity Studio.
- **Rapid Prototyping:** Test content structures and experiment with field configurations before implementing them in your project.
- **Learning and Demonstrations:** Introduce Sanity to colleagues, clients, and newcomers through a hands-on experience.
- **No Setup Required:** Explore Sanity without creating a project or configuring a local development environment.
- **Isolated Execution:** Playground code runs in an opaque-origin sandbox, with network connections disabled. Remote image URLs are not supported in the sandbox.

## Who is it for?

**Developers:** Experiment with schemas and validate content modelling ideas.

**Beginners:** Discover how Sanity schemas work through a practical, visual experience.

**Agencies and Teams:** Demonstrate Sanity's flexibility to clients and colleagues without building a complete project.

## Getting Started

1. Visit [sanity-playground.com](https://www.sanity-playground.com/).
2. Write or modify a Sanity schema in the editor.
3. See the corresponding Studio form in the live preview.
4. Experiment with different fields and content structures.

## Built With

- Next.js
- React
- TypeScript
- Sanity Studio

## Current Limitations

The preview supports a subset of schema features. Portable Text is presented as simplified plain-text editing, references use a manual identifier input, and advanced validation or custom input components are not fully simulated. Avoid pasting secrets into the playground. User-written JavaScript runs inside a restricted iframe, not in a backend environment.

## Feedback and Contributions

Sanity Playground is an independent project built for the Sanity developer community.

Feedback, suggestions, and contributions are welcome.

[View the GitHub Repository](https://github.com/leandroBarbosaFR/sanity-playground)

## Disclaimer

Sanity Playground is an independent community tool and is not an official Sanity product.
