/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'
import { buildExtensionZip, EXTENSION_ZIP_NAME } from './scripts/extension-zip.js'

const extensionDir = fileURLToPath(new URL('./meet-transcriber-extension', import.meta.url))

// Serves the Chrome extension as a fresh zip, in dev and in the production build
function extensionZip() {
  return {
    name: 'extension-zip',
    configureServer(server) {
      server.middlewares.use(`/${EXTENSION_ZIP_NAME}`, (req, res) => {
        res.setHeader('Content-Type', 'application/zip')
        res.end(Buffer.from(buildExtensionZip(extensionDir)))
      })
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: EXTENSION_ZIP_NAME, source: buildExtensionZip(extensionDir) })
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    extensionZip(),
    VitePWA({
      registerType: 'autoUpdate',
      // The extension zip is a download, not an app route
      workbox: { navigateFallbackDenylist: [/\.zip$/] },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'TaskBuddy',
        short_name: 'TaskBuddy',
        description: 'Record and transcribe conversations',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  define: {
    'global': 'window'
  }
})