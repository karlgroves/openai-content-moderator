import js from '@eslint/js';
import globals from 'globals';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import n from 'eslint-plugin-n';
import unicorn from 'eslint-plugin-unicorn';
import noSecrets from 'eslint-plugin-no-secrets';
import jsdoc from 'eslint-plugin-jsdoc';

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      security,
      sonarjs,
      n,
      unicorn,
      'no-secrets': noSecrets,
      jsdoc,
    },
    rules: {
      // Code quality
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',

      // Security (built-in)
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',

      // Best practices
      eqeqeq: ['error', 'always'],
      curly: ['error', 'all'],

      // Phase 1: new plugins start as warnings. Tighten in follow-up PRs.
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-buffer-noassert': 'warn',
      'security/detect-child-process': 'warn',
      'security/detect-eval-with-expression': 'warn',
      'security/detect-no-csrf-before-method-override': 'warn',
      'security/detect-possible-timing-attacks': 'warn',
      'security/detect-pseudoRandomBytes': 'warn',

      'sonarjs/cognitive-complexity': ['warn', 15],
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }],
      'sonarjs/no-identical-functions': 'warn',
      'sonarjs/no-collapsible-if': 'warn',
      'sonarjs/no-redundant-boolean': 'warn',
      'sonarjs/no-redundant-jump': 'warn',
      'sonarjs/no-small-switch': 'warn',
      'sonarjs/no-unused-collection': 'warn',
      'sonarjs/no-useless-catch': 'warn',
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/prefer-single-boolean-return': 'warn',

      'n/no-deprecated-api': 'warn',
      'n/no-process-exit': 'warn',
      'n/prefer-promises/fs': 'warn',
      'n/prefer-promises/dns': 'warn',

      'unicorn/filename-case': ['warn', { cases: { kebabCase: true, camelCase: true } }],
      'unicorn/no-null': 'off',
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/prefer-module': 'off',
      'unicorn/prefer-top-level-await': 'off',

      'no-secrets/no-secrets': ['warn', { tolerance: 4.5, ignoreContent: ['https?://', 'data:image/'] }],

      'jsdoc/check-tag-names': 'warn',
      'jsdoc/check-alignment': 'warn',
      'jsdoc/no-undefined-types': 'off',
    },
  },
  {
    // Test file overrides
    files: ['tests/**/*.js', 'tests/**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      'no-console': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/cognitive-complexity': 'off',
      'no-secrets/no-secrets': 'off',
    },
  },
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '*.min.js',
      'reports/**',
      'eslint.config.mjs',
    ],
  },
];
