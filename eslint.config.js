import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // Base JS rules (covers all JS/TS files)
  js.configs.recommended,

  // React hooks & refresh rules (apply to src only)
  reactHooks.configs.flat.recommended,
  reactRefresh.configs.vite,

  // TypeScript rules for app source files
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tseslint },
    languageOptions: {
      globals: globals.browser,
      parser: tsParser,
      parserOptions: {
        project: ['./tsconfig.app.json'],
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...tseslint.configs.recommended.rules
    },
  },

  // TypeScript rules for build-config files (use node tsconfig)
  {
    files: ['vite.config.ts'],
    plugins: { '@typescript-eslint': tseslint },
    languageOptions: {
      globals: globals.node,
      parser: tsParser,
      parserOptions: { project: ['./tsconfig.node.json'] },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
    },
  },
])
