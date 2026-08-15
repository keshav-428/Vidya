import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { globalIgnores } from 'eslint/config'

export default tseslint.config([
  // `android` holds the generated native project — Capacitor copies the built
  // web bundle and its own bridge script in there, none of which is ours to lint.
  globalIgnores(['dist', 'android']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      // This codebase uses the `cond && sideEffect()` / ternary idiom widely.
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
    },
  },
  {
    // The app entry (no exports) and the concept render-helper module are not
    // Fast-Refresh component boundaries, so this dev-only rule doesn't apply.
    files: ['src/main.tsx', 'src/content/conceptVisuals.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
