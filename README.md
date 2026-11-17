# Micraft

Micraft is a personal UI/UX design and frontend portfolio built with React, TypeScript, and Vite.

## Stack

- React and TypeScript
- Vite
- Tailwind CSS
- Motion for React
- Lenis smooth scrolling

## Local development

Requires Node.js and npm.

```sh
npm ci
npm run dev
```

## Project commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local development server |
| `npm run typecheck` | Check the TypeScript project |
| `npm run lint` | Run Oxlint |
| `npm run build` | Type-check and create the production build |
| `npm run preview` | Preview the production build locally |

## Vercel deployment

Use the **Vite** framework preset, `npm ci` as the install command, `npm run build` as the build command, and `dist` as the output directory. The website currently needs no production environment variables, API routes, or SPA rewrite rules; its page navigation uses URL hashes.

The optional `FREELLMAPI_API_KEY` in `.env.example` is for local OpenCode tooling only. It is not read by the website and should not be added to Vercel.
