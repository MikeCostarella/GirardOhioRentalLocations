import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base must match the GitHub Pages repo path EXACTLY (case-sensitive):
// repo is github.com/MikeCostarella/GirardOhioRentalLocations
//   -> served at /GirardOhioRentalLocations/
export default defineConfig({
  base: '/GirardOhioRentalLocations/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Girard Ohio Rental Location Map',
        short_name: 'Girard Rentals',
        description:
          'Interactive map of registered rental locations in Girard, Ohio, showing single-unit and multi-tenant properties.',
        theme_color: '#1a3a5c',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/GirardOhioRentalLocations/',
        start_url: '/GirardOhioRentalLocations/',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
      workbox: {
        // data file is ~190KB; keep precache ceiling comfortable
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
    }),
  ],
  define: {
    // Injected at build time for the "Last updated" stamp.
    // Forced to America/New_York so deployed builds (GitHub UTC servers) show
    // Eastern time, with EDT/EST resolved automatically.
    __BUILD_DATE__: JSON.stringify(
      new Date().toLocaleString('en-US', {
        timeZone: 'America/New_York',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        timeZoneName: 'short',
      })
    ),
  },
})
