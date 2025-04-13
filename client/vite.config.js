import path from 'path';
import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@common': path.resolve(__dirname, '../common'),
      '@client': path.resolve(__dirname, './src'),
    },
  },
});
