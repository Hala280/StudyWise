import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // NOTE: adjust `base` if your .NET app serves this from a sub-path
  // e.g. base: '/app/' if wwwroot serves it under /app/
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
});
