# milhaus

A rental-listing marketplace for Americans relocating to Germany, combining
on-base housing office listings with self-listed homes from families
rotating out. See [CLAUDE.md](./CLAUDE.md) for the full project brief and
build plan.

## Stack

Next.js (App Router, TypeScript) · Supabase (Postgres, auth, storage) ·
Tailwind CSS · Vercel

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase project keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Design reference

The approved landing page mockup lives at
[design-reference/milhaus-landing-mockup.html](./design-reference/milhaus-landing-mockup.html)
and is the source of truth for visual direction (colors, type, layout).
