import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: "/lir2026/",
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        id: '/lir2026/',
        name: 'LIR 2026 Planner',
        short_name: 'LIR Planner',
        description: 'Offline-first personal timetable and visit planner for Lake Most, 2026.',
        start_url: '/lir2026/',
        scope: '/lir2026/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#090a12',
        theme_color: '#6d4aff',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/lir2026/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,csv}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true
  }
})
