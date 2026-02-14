import { createConfigForNuxt } from '@nuxt/eslint-config'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import eslintPluginPrettier from 'eslint-plugin-prettier'

export default createConfigForNuxt()
  .override('nuxt/typescript/rules', {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off', // Disabled globally - too noisy for pragmatic code
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/unified-signatures': 'off', // Style preference, not valuable
    },
  })
  .override('nuxt/vue/rules', {
    rules: {
      'vue/no-v-html': 'off', // We use v-html intentionally for formatted citations
      'vue/require-default-prop': 'off', // Optional props don't always need defaults
    },
  })
  .append(eslintConfigPrettier, {
    plugins: { prettier: eslintPluginPrettier },
    rules: {
      'prettier/prettier': 'warn',
    },
  })
