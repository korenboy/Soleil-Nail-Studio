import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'assets',
  server: {
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
