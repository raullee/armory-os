import { defineConfig } from 'vite';

// Path alias resolved without Node typings so the config typechecks in any environment.
const srcDir = new URL('./src', import.meta.url).pathname;

export default defineConfig({
  resolve: { alias: { '@': srcDir } },
  build: {
    target: 'es2022',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
        },
      },
    },
  },
  server: { port: 5173, strictPort: false },
});
