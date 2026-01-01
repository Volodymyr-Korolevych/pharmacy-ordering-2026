import js from '@eslint/js'

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,ts,vue}'],
    ignores: ['.nuxt/**', 'dist/**', 'node_modules/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    rules: {
      'no-unused-vars': 'off'
    }
  }
]
