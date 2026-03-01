import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fix Three.js WebGPU import issue - stub it to use WebGL
      'three/webgpu': path.resolve(__dirname, './src/lib/three-webgpu-stub.js'),
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
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  }
})
