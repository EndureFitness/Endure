import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// `base` must match the GitHub Pages project path (case-sensitive).
// Repo: https://github.com/EndureFitness/Endure  →  served at /Endure/
export default defineConfig({
  base: '/Endure/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon-180.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
        'icons/icon-maskable-512.png',
        'og-image.png',
      ],
      manifest: {
        name: 'Endure',
        short_name: 'Endure',
        description: 'Privacy-first military fitness tracker.',
        // start_url and scope are written by the plugin relative to `base`.
        start_url: '.',
        scope: '.',
        display: 'standalone',
        background_color: '#0c0d09',
        theme_color: '#0c0d09',
        orientation: 'portrait',
        categories: ['health', 'fitness'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
        runtimeCaching: [
          {
            // Cache CARTO dark-matter tiles (and OSM raw, just in case) so
            // previously-run routes still render their map when offline.
            urlPattern: ({ url }) =>
              url.hostname.endsWith('basemaps.cartocdn.com') ||
              url.hostname.endsWith('tile.openstreetmap.org'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  build: {
    target: 'es2020',
    sourcemap: false,
  },
});
