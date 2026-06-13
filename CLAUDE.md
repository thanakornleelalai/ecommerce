# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

A full-stack e-commerce admin app: Next.js 15 App Router frontend + API route handlers,
backed by MySQL via `mysql2`. CRUD for customers, products, and orders. The frontend
supports inline editing for customers and products (including image upload on both
create and edit), and order status can be updated via the orders admin UI. The orders
POST endpoint is transactional (validates stock, decrements it, rolls back on error).

Setup: create the DB and load data with `schema.sql` then `seed.sql`, configure
`.env.local` (defaults: localhost:3307, db `ecommerce`), then `npm run dev`.

## Commands

```bash
npm run dev      # Start dev server (Next.js + Turbopack) at http://localhost:3000
npm run build    # Production build (Turbopack)
npm start        # Serve the production build (run build first)
```

There is no lint, test, or typecheck script configured. To typecheck manually, run
`npx tsc --noEmit`.

## Architecture

- **Next.js 15 App Router** (`app/` directory) with **React 19** and **TypeScript** (strict mode).
- **Tailwind CSS v4** via `@tailwindcss/postcss` (configured in `postcss.config.mjs`,
  imported through `app/globals.css`) — there is no `tailwind.config.*` file; v4 is
  config-less by default.
- **Path alias**: `@/*` maps to the repo root (e.g. `import x from "@/lib/db"`).
- **Database**: `lib/db.ts` exports a singleton `mysql2/promise` pool (cached on
  `globalThis` in dev to survive hot-reload), the `query`/`execute` helpers (always
  parameterized), and all domain types/interfaces. Set `DB_SSL=true` for TiDB/managed MySQL.
- **API route handlers** (`app/api/**/route.ts`) are `force-dynamic`, return JSON via
  `NextResponse`, and use async `params` (`params: Promise<{ id: string }>` in Next 15).
  Multi-step writes use `pool.getConnection()` + `beginTransaction`/`commit`/`rollback`
  (see `app/api/orders/route.ts`).
- **Frontend pages** are `"use client"` components that fetch the API with relative URLs
  and manage their own loading/error state. Light theme only — no dark mode.
- **Image uploads**: `lib/upload.ts` saves uploaded files to `public/uploads/` (created
  on demand) with a random hex filename, and exposes them via `/uploads/<file>`. It
  validates that the upload is an image and ≤ 5MB, and provides `deleteUploadedFile`
  for cleanup. The `customers` and `products` tables have an `image_url` column
  (`VARCHAR(500)`, nullable). The customer and product API routes (POST/PATCH) accept
  `multipart/form-data` with an optional `image` field; on PATCH, replacing the image
  deletes the previous file. The customers and products admin pages submit `FormData`
  (not JSON) and render a thumbnail in the table.

## Conventions

- Both `dev` and `build` use the `--turbopack` flag — keep new tooling compatible with Turbopack.
- This is a Windows environment; the shell is PowerShell. Use PowerShell syntax for shell commands.
