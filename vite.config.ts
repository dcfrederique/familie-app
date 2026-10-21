/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
      manifest: {
        name: 'Sterren',
        short_name: 'Sterren',
        description: 'Taken doen, sterren verdienen en inwisselen voor extra tijd.',
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
