/**
 * @file vite.config.js
 * @description Configuración de Vite para el proyecto Architecture World.
 * Define rutas relativas, opciones de compilación (target ES2022, minificación
 * con Terser eliminando console.logs), y separación de chunks para Three.js
 * y sus módulos de postprocesamiento.
 */
import { defineConfig } from 'vite'

export default defineConfig({
  base: './',
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    minify: 'terser',
    cssCodeSplit: true,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          'three-examples': [
            'three/examples/jsm/postprocessing/EffectComposer.js',
            'three/examples/jsm/postprocessing/RenderPass.js',
            'three/examples/jsm/postprocessing/UnrealBloomPass.js',
            'three/examples/jsm/postprocessing/FilmPass.js',
            'three/examples/jsm/utils/BufferGeometryUtils.js'
          ]
        }
      }
    }
  }
})