import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// `--mode single` produces dist-single/SEVEN.html: one self-contained file that
// runs from file:// (Windows double-click launcher). Default mode builds the PWA.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  build: {
    outDir: mode === 'single' ? 'dist-single' : 'dist',
    emptyOutDir: true,
    assetsInlineLimit: mode === 'single' ? 100_000_000 : 4096,
  },
  worker: { format: 'es' },
  test: { include: ['tests/**/*.test.ts'], testTimeout: 120_000 },
}));
