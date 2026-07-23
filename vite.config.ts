import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { execFileSync } from 'node:child_process'

const gitValue = (args: string[], fallback: string) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8' }).trim() || fallback
  } catch {
    return fallback
  }
}

export default defineConfig(() => {
  const buildNumber = gitValue(['rev-list', '--count', 'HEAD'], process.env.GITHUB_RUN_NUMBER ?? '0')
  const revisionFallback = (process.env.GITHUB_SHA ?? 'unknown').slice(0, 7)
  const revision = gitValue(['rev-parse', '--short', 'HEAD'], revisionFallback)

  return {
  base: "/lir2026/",
  define: {
    __BUILD_NUMBER__: JSON.stringify(buildNumber),
    __BUILD_REVISION__: JSON.stringify(revision),
  },
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
  }
})
