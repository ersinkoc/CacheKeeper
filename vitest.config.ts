import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom',
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/**/*.d.ts',
        'src/**/index.ts',
        'src/types.ts',
      ],
      thresholds: {
        lines: 96,
        functions: 96,
        branches: 90,
        statements: 96,
      },
    },
    setupFiles: ['./tests/setup.ts'],
  },
})
