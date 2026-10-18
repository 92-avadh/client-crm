import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, type Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'

/**
 * SPA fallback: serves index.html for any non-asset path
 * so client-side routes (/dashboard, /clients, ...) work on
 * refresh and deep links in production static hosting.
 */
function spaHistoryFallback(): Plugin {
  return {
    name: 'spa-history-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && !req.url.includes('.') && !req.url.startsWith('/@') && !req.url.startsWith('/node_modules')) {
          const indexPath = path.resolve(server.config.root, 'index.html')
          if (fs.existsSync(indexPath)) {
            const rawHtml = fs.readFileSync(indexPath, 'utf-8')
            server.transformIndexHtml(req.url, rawHtml).then(html => {
              res.statusCode = 200
              res.setHeader('Content-Type', 'text/html')
              res.end(html)
            }).catch(next)
            return
          }
        }
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && !req.url.includes('.') && !req.url.startsWith('/@')) {
          const indexPath = path.resolve(server.config.root, 'dist/index.html')
          if (fs.existsSync(indexPath)) {
            res.statusCode = 200
            res.setHeader('Content-Type', 'text/html')
            res.end(fs.readFileSync(indexPath, 'utf-8'))
            return
          }
        }
        next()
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), spaHistoryFallback()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',   // Required for Docker — allows access from outside the container
    watch: {
      usePolling: true,
      interval: 100,
    },
  },
  build: {
    sourcemap: false,
  },
})
