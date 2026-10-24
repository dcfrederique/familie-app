# Familie-app: Sterren

Gezinsapp waarin de kinderen sterren verdienen met taken en die inwisselen voor extra schermtijd. Zie `CLAUDE.md` en `docs/spec.md`.

## Stack

- PWA met React, Vite en TypeScript
- Supabase (database, login, opslag)
- Hosting: Azure Static Web Apps, automatisch na groene CI op `main` (zie `docs/hosting.md`)

## Lokaal starten

```bash
npm install
cp .env.example .env.local   # vul de Supabase-gegevens in (mag voorlopig leeg blijven)
npm run dev
```

| Commando | Wat |
| --- | --- |
| `npm run dev` | Ontwikkelserver |
| `npm test` | Tests (Vitest) |
| `npm run lint` | Lint (oxlint) |
| `npm run build` | Productiebouw in `dist/`, met service worker |
