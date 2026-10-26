import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

function autoVersionPlugin() {
  const buildTime = Date.now();
  const buildDate = new Date().toISOString();
  const versionPayload = {
    version: '2.1.0',
    buildTime,
    buildDate,
    message: '¡Nueva actualización de Baby Day! Mejoras y novedades listas.'
  };

  return {
    name: 'auto-version-plugin',
    buildStart() {
      try {
        const publicDir = path.resolve(__dirname, 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        fs.writeFileSync(
          path.resolve(publicDir, 'version.json'),
          JSON.stringify(versionPayload, null, 2)
        );
      } catch (e) {
        console.warn('Could not write public/version.json:', e);
      }
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify(versionPayload, null, 2)
      });
    }
  };
}

export default defineConfig(() => {
  const currentBuildTime = Date.now().toString();

  return {
    define: {
      __APP_BUILD_TIME__: JSON.stringify(currentBuildTime),
      __APP_VERSION__: JSON.stringify('2.1.0'),
    },
    plugins: [
      autoVersionPlugin(),
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          navigateFallbackDenylist: [/^\/api/, /version\.json$/],
          runtimeCaching: [
            {
              urlPattern: /version\.json$/,
              handler: 'NetworkOnly',
            }
          ]
        },
        manifest: false // using existing manifest in public
      })
    ],
    resolve: {
      dedupe: ['react', 'react-dom'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
