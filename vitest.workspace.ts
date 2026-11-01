import { defineWorkspace } from 'vitest/config';
import path from 'path';

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      exclude: ['**/*.integration.test.ts'],
      alias: {
        'server-only': path.resolve(__dirname, './src/__mocks__/server-only.ts'),
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        'server-only': path.resolve(__dirname, './src/__mocks__/server-only.ts'),
      },
    },
  },
  {
    test: {
      name: 'integration',
      include: ['src/**/*.integration.test.ts'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  },
]);
