// Use recommended rules from typescript-eslint and standard.  See https://github.com/standard/standard/issues/1283

module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json'
  },
  extends: [
    'plugin:@typescript-eslint/recommended',
    'standard'
  ],
  plugins: [
    '@typescript-eslint'
  ],
    rules: {
    // Remove any type warnings.
    '@typescript-eslint/no-explicit-any':['error',{
      fixToUnknown: false,
      ignoreRestArgs: false
    }],
    // Don't require semicolons in interface definitions
    '@typescript-eslint/member-delimiter-style': ['error', {
      multiline: {
        delimiter: 'none',
        requireLast: false
      },
      singleline: {
        delimiter: 'comma',
        requireLast: false
      }
    }],
    // Support importing types
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    // CDK requires use of the new keyword with side effects
    'no-new': 'off',
    '@typescript-eslint/no-use-before-define': 'off'
  },
  overrides: [
    {
      files: ['*.test.ts'],
      rules: {
        // Tap tests use a var require
        '@typescript-eslint/no-var-requires': 'off'
      }
    }
  ],
  "env": {
    "jest": true
  }
}
