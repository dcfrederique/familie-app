import { defineConfig } from '@playwright/test'

// End-to-endtests in de demo (zonder Supabase). Lokaal: `npm run test:e2e`.
export default defineConfig({
  testDir: 'e2e',
  webServer: { command: 'npx vite --port 5173 --host 127.0.0.1', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
  use: { baseURL: 'http://127.0.0.1:5173', launchOptions: { executablePath: process.env.PW_CHROMIUM || undefined } },
})
