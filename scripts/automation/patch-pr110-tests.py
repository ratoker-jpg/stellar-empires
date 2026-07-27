from pathlib import Path

Path('vitest.config.ts').write_text(
    """import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [...configDefaults.exclude, 'tests/e2e/**'],
  },
});
""",
    encoding='utf-8',
)
print('Separated Playwright E2E specs from the Vitest unit suite.')
