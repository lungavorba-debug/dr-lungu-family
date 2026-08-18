import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const workspaceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function lanDevBannerPlugin(): Plugin {
  return {
    name: 'medscreen-lan-dev-banner',
    configureServer(server) {
      server.httpServer?.once('listening', () => {
        const port = typeof server.config.server.port === 'number' ? server.config.server.port : 5173;
        void import('../../scripts/dev-lan-urls.mjs').then(({ printCombinedDevBanner }) =>
          printCombinedDevBanner({ webPort: port, webRunning: true }),
        );
      });
    },
  };
}

const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:3001',
    changeOrigin: true,
  },
};

export default defineConfig({
  plugins: [
    react(),
    lanDevBannerPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png'],
      manifest: {
        name: 'MedScreen Festival & Event Suite',
        short_name: 'MedScreen',
        description: 'Medical screening platform for festivals and public events',
        theme_color: '#0f766e',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        skipWaiting: true,
        clientsClaim: true,
        navigateFallbackDenylist: [/^\/api\//],
      },
      // Disable service worker in dev — prevents stale cache / ERR_CONNECTION_REFUSED on LAN.
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
      '@medscreen/types': path.resolve(workspaceRoot, 'packages/types/src/index.ts'),
      '@medscreen/config': path.resolve(workspaceRoot, 'packages/config/src/index.ts'),
      '@medscreen/shared': path.resolve(workspaceRoot, 'packages/shared/src/index.ts'),
      '@medscreen/ui': path.resolve(workspaceRoot, 'packages/ui/src/index.ts'),
    },
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    watch: {
      ignored: ['!**/packages/shared/src/**'],
    },
    proxy: apiProxy,
  },
  preview: {
    port: 4173,
    host: true,
    allowedHosts: true,
    proxy: apiProxy,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
