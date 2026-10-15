import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['GymFitLogo01.webp', 'GymFitLogo01.svg', 'favicon.ico'],
        manifest: {
          id: '/',
          name: 'GymFit Manager',
          short_name: 'GymFit',
          description: 'SaaS de entrenamiento y prescripción biomecánica offline-first para salas de gimnasio.',
          theme_color: '#090D16',
          background_color: '#090D16',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/GymFitLogo01.webp',
              sizes: '192x192',
              type: 'image/webp',
              purpose: 'any',
            },
            {
              src: '/GymFitLogo01.webp',
              sizes: '512x512',
              type: 'image/webp',
              purpose: 'any',
            },
            {
              src: '/GymFitLogo01.webp',
              sizes: '512x512',
              type: 'image/webp',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,webp,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor-react';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('@supabase')) {
                return 'vendor-supabase';
              }
            }
          },
        },
      },
    },
  };
});