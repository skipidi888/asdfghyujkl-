// ESLint flat config for vanilla browser JS.
// No build step. CDN deps (THREE, topojson) + window globals (DPH_*) treated as known.
const globals = require('globals').browser;

module.exports = [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        ...globals,
        THREE: 'readonly',
        topojson: 'readonly',
        DPH_DATA: 'readonly',
        DPH_GLOBE: 'readonly',
        DPH_ANIM: 'readonly',
        DPH_SIM: 'readonly',
        DPH_APP: 'readonly',
        SimWindow: 'readonly',
      },
    },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'warn',
      'eqeqeq': ['error', 'smart'],
      'no-var': 'error',
    },
  },
  {
    files: ['eslint.config.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
];
