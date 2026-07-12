import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // three-vendor (3D room preview) and recharts (admin analytics) are both real
    // 300kB+ dependencies, but neither ships on first load — they're only fetched
    // when a room-preview modal or an admin chart page is actually opened. Raising
    // this past their size just quiets the build warning for a trade-off already
    // made on purpose; it doesn't change what any real user downloads.
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: {
          'three-vendor': ['three', '@react-three/fiber', '@react-three/drei'],
          // recharts, stripe, and lottie are deliberately left out of a shared vendor
          // chunk — they're only pulled in by lazy-loaded routes/components (admin
          // analytics/dashboard, checkout, the preloader animation), so Rollup bundles
          // each into its own async chunk instead of shipping them on every page load.
        },
      },
    },
  },
} );
