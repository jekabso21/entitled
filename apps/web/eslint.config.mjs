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
    files: ['app/pages/**/*.vue'],
    rules: { 'unicorn/filename-case': 'off' },
  },
)
