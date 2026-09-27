import { sharedRules } from '@entitled/config-eslint/rules'
import prettier from 'eslint-config-prettier'
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(...sharedRules, prettier).append(
  {
    files: ['**/*.vue', 'nuxt.config.ts', 'app/app.config.ts'],
    rules: { 'import-x/no-default-export': 'off' },
  },
  {
    // Components are PascalCase (Nuxt derives tag names from them); pages and layouts follow route names.
    files: ['app/components/**/*.vue'],
    rules: { 'unicorn/filename-case': ['error', { case: 'pascalCase', checkDirectories: false }] },
  },
  {
    // Route files follow URL segments ([token].vue, [...path].ts) and Nitro handlers need default exports.
    files: ['app/pages/**/*.vue', 'server/routes/**/*.ts'],
    rules: { 'unicorn/filename-case': 'off', 'import-x/no-default-export': 'off' },
  },
  {
    files: ['app/plugins/**/*.ts', 'app/middleware/**/*.ts'],
    rules: { 'import-x/no-default-export': 'off' },
  },
)
