import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['server/**/*.test.js', 'src/**/*.test.{js,jsx}'],
    environment: 'node',
    setupFiles: ['./vitest.setup.js'],
    globals: false
  }
});
