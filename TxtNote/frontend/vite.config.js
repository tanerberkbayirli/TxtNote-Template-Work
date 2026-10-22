import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// ESM-native — package.json has "type": "module", so don't rely on __dirname.
const here = path.dirname(fileURLToPath(import.meta.url)) // <repo>/frontend
const repoRoot = path.resolve(here, '..')                 // <repo>
const engineRoot = path.resolve(repoRoot, '../engine')
const templatesRoot = path.resolve(repoRoot, '../Butun-Sablonlar') // template data (JSON) the engine imports

const host = process.env.TAURI_DEV_HOST

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // WebView2 is Chromium; skip legacy transforms so the shell parses faster.
    target: "chrome122",
    modulePreload: { polyfill: false },
    // Brand PNGs stay as files in dist/assets so the JS parse cost stays low.
    // Tinos must be inlined: Tauri CSP connect-src blocks fetch() of .ttf URLs.
    assetsInlineLimit(filePath, content) {
      if (/Tinos-.*\.ttf$/i.test(String(filePath).replaceAll("\\", "/"))) return true;
      return content.length < 4096;
    },
  },

  // Tauri prints Rust errors next to Vite; don't wipe the terminal.
  clearScreen: false,

  resolve: {
    // The application and the external engine must share runtime identities.
    dedupe: ['react', 'react-dom', 'docx', 'jspdf', 'fflate', '@xmldom/xmldom'],
    // Most specific first. Vite matches an alias only on an exact hit or on
    // `alias + "/"`, so '@' will not swallow '@services', but ordering is
    // still the safe habit.
    alias: {
      '/engine': path.resolve(engineRoot, 'src'),
      '@engine': path.resolve(engineRoot, 'src'),
      '@shared/types': path.resolve(repoRoot, 'types/index.ts'),
      '@shared/services': path.resolve(repoRoot, 'services/index.ts'),
      '@services': path.resolve(repoRoot, 'services'),
      '@app': path.resolve(here, 'src'),
      '@': path.resolve(here, 'src'),
      '@tauri-apps/api': path.resolve(repoRoot, 'node_modules/@tauri-apps/api'),
      '@tauri-apps/plugin-updater': path.resolve(repoRoot, 'node_modules/@tauri-apps/plugin-updater'),
      '@tauri-apps/plugin-process': path.resolve(repoRoot, 'node_modules/@tauri-apps/plugin-process'),
    },
  },

  server: {
    port: 5173,
    strictPort: true,
    host: host || false,
    hmr: host
      ? { protocol: 'ws', host, port: 1421 }
      : undefined,
    watch: {
      ignored: ['**/src-tauri/**'],
    },
    fs: {
      // services/ and types/ sit ABOVE the Vite root. Without this, Vite
      // refuses to serve them: "outside of Vite serving allow list".
      allow: [repoRoot, engineRoot, templatesRoot],
    },
  },
})
