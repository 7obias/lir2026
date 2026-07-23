import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: "/lir2026/",
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        id: '/lir2026/',
        name: 'Let It Roll 2026 Thursday Timetable',
        short_name: 'LIR Timetable',
        description: 'Official Thursday timetable viewer for Let It Roll 2026.',
        start_url: '/lir2026/',
        scope: '/lir2026/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#090a12',
        theme_color: '#0d0f15',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        navigateFallback: '/lir2026/index.html',
        globPatterns: ['**/*.{js,css,html,png}'],
        cleanupOutdatedCaches: true
      }
    })
  ],
  test: {
    environment: 'node'
  }
})
