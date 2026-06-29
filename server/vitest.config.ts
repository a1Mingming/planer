import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    extensions: ['.ts', '.js'],
  },
  test: {
    globals: true,
    environment: 'node',
    server: {
      deps: {
        // Treat native modules as external so they're loaded via require() not Vite
        external: ['better-sqlite3'],
      },
    },
  },
});
