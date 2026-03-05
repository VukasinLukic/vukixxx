import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Tauri: don't clear terminal on dev server start
  clearScreen: false,

  // Define global variables for browser compatibility
  define: {
    'global': 'globalThis',
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fix Three.js WebGPU import issue - stub it to use WebGL
      'three/webgpu': path.resolve(__dirname, './src/lib/three-webgpu-stub.js'),
      // Add buffer polyfill for gray-matter
      'buffer': 'buffer/',
    },
  },

  // Tauri: configure dev server for HMR
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Tell Vite to ignore watching src-tauri
      ignored: ['**/src-tauri/**'],
    },
  },

  // Optimize deps to prevent Three.js issues
  optimizeDeps: {
    include: ['three', 'react-force-graph-3d'],
    esbuildOptions: {
      target: 'esnext'
    }
  },

  build: {
    // Tauri: produce output that works with file:// protocol
    target: process.env.TAURI_ENV_PLATFORM ? 'esnext' : 'esnext',
    // Raise chunk size warning limit (Three.js is large)
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        widget: path.resolve(__dirname, 'widget.html'),
        'save-widget': path.resolve(__dirname, 'save-widget.html'),
      },
    },
  },

  // Tauri: env prefix for TAURI_ variables
  envPrefix: ['VITE_', 'TAURI_ENV_'],
})
