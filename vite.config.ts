/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Nieuwe versie wacht tot src/lib/nieuweversie.ts een goed moment kiest om te wisselen.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Meldingen voor ouders: push en klikken op een melding (public/push-sw.js).
        importScripts: ['push-sw.js'],
        // Opnames van de voorleesstem: niet vooraf (±20 MB), wel bewaren zodra een verhaal één keer gespeeld is.
        // De bestandsnaam is een hash van de tekst, dus een bewaarde opname is nooit verouderd.
        runtimeCaching: [{
          urlPattern: ({ url }) => url.pathname.startsWith('/stem/'),
          handler: 'CacheFirst',
          options: { cacheName: 'stem', expiration: { maxEntries: 1200 }, cacheableResponse: { statuses: [200] } },
        }],
      },
      manifest: {
        name: 'Familie',
        short_name: 'Familie',
        description: 'De gezinsapp: taken doen, sterren verdienen en inwisselen voor extra tijd.',
        lang: 'nl-BE',
        start_url: '/',
        display: 'standalone',
        // Kinderen gebruiken een tablet liggend, ouders een gsm: geen vaste oriëntatie.
        orientation: 'any',
        background_color: '#EEF3F8',
        theme_color: '#2D6BD6',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  test: {
    environment: 'node',
  },
})
