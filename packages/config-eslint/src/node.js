import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import { defineConfig } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import { sharedRules } from './rules.js'

export function nodeConfig(tsconfigRootDir) {
  return defineConfig(
    { ignores: ['dist/**', 'coverage/**', 'migrations/**'] },
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        globals: globals.node,
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      rules: { '@typescript-eslint/consistent-type-imports': 'error' },
    },
    {
      files: ['**/*.js'],
      extends: [tseslint.configs.disableTypeChecked],
    },
    sharedRules,
    prettier,
  )
}
