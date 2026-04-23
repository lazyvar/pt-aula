# pt-aula

Svelte + TypeScript frontend, Express + Postgres backend, Claude Haiku for on-demand sentence generation.

## Quick start

```bash
npm install
npm run dev:all   # vite on :5173 + express on :3005
```

Requires a local Postgres (`DATABASE_URL` defaults to `postgres://localhost/pt_aula`) and `ANTHROPIC_API_KEY` for generated sentences.

## Scripts

- `npm run dev` — Vite dev server
- `npm start` — Express server
- `npm run build` — production build into `dist/`
- `npm test` — Playwright tests against a dockerized test DB
- `npm run check` — svelte-check typecheck

## Deploy

Fly.io via the included `Dockerfile` and `fly.toml`.
