import importX from 'eslint-plugin-import-x'
import unicorn from 'eslint-plugin-unicorn'

export const sharedRules = [
  {
    plugins: { 'import-x': importX, unicorn },
    rules: {
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-depth': ['error', 3],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'import-x/no-default-export': 'error',
      'import-x/no-duplicates': 'error',
      'import-x/no-cycle': 'error',
      'unicorn/filename-case': ['error', { case: 'kebabCase' }],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  {
    files: ['**/*.config.{js,ts,mjs,mts}', '**/eslint.config.js'],
    rules: { 'import-x/no-default-export': 'off' },
  },
]
