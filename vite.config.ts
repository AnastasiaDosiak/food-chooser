import type { IncomingMessage, ServerResponse } from 'node:http';
import { fileURLToPath, URL } from 'node:url';

import react from '@vitejs/plugin-react';
import type { Plugin, ViteDevServer } from 'vite';
import { defineConfig } from 'vitest/config';

const OVERPASS_DEV_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const DEV_ENDPOINT_TIMEOUT_MS = 7000;

/** Mirrors api/venues.js for `npm run dev` — Vite doesn't run the Vercel serverless function. */
const venuesDevProxy = (): Plugin => ({
  name: 'venues-dev-proxy',
  configureServer(server: ViteDevServer) {
    server.middlewares.use(
      (req: IncomingMessage, res: ServerResponse, next: () => void): void => {
        if (!req.url || !req.url.startsWith('/api/venues')) {
          next();
          return;
        }
        const query = new URL(req.url, 'http://localhost').searchParams.get('q');
        if (!query) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing q' }));
          return;
        }
        void (async () => {
          for (const endpoint of OVERPASS_DEV_ENDPOINTS) {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), DEV_ENDPOINT_TIMEOUT_MS);
            try {
              const upstream = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `data=${encodeURIComponent(query)}`,
                signal: controller.signal,
              });
              if (!upstream.ok) {
                continue;
              }
              const data = (await upstream.json()) as { elements?: unknown[] };
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ elements: data.elements ?? [] }));
              return;
            } catch {
              // try the next mirror
            } finally {
              clearTimeout(timer);
            }
          }
          res.statusCode = 502;
          res.end(JSON.stringify({ error: 'Overpass unreachable' }));
        })();
      },
    );
  },
});

export default defineConfig({
  plugins: [react(), venuesDevProxy()],
  server: {
    // Vite rejects unknown Host headers; allow ngrok tunnel domains for demo sharing.
    allowedHosts: ['.ngrok-free.app', '.ngrok.app', '.ngrok.io'],
  },
  resolve: {
    alias: {
      '@components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@hooks': fileURLToPath(new URL('./src/hooks', import.meta.url)),
      '@utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
      '@common': fileURLToPath(new URL('./src/common', import.meta.url)),
      '@shared-types': fileURLToPath(new URL('./src/types', import.meta.url)),
      '@styles': fileURLToPath(new URL('./src/styles', import.meta.url)),
      '@assets': fileURLToPath(new URL('./src/assets', import.meta.url)),
      '@services': fileURLToPath(new URL('./src/services', import.meta.url)),
      '@i18n': fileURLToPath(new URL('./src/i18n', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
