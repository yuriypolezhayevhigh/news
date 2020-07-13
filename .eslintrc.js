module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    parser: 'babel-eslint',
    "ecmaVersion": 2020,
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true,
    },
  },
  extends: [
    // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
    // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
    // '@nuxtjs',
    // 'plugin:vue/essential',
    'eslint:recommended',
    "plugin:node/recommended",
  ],
  // required to lint *.vue files
  plugins: [
    // 'vue'
  ],
  // add your custom rules here
  rules: {
    'curly': ['error', 'multi-line'],
    'space-before-function-paren': ['error', 'always'],
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-param-reassign': [2, { props: false }], // Disallow Reassignment of Function Parameters
    'padded-blocks': [2, { classes: 'never', blocks: 'never' }],
    'no-unused-expressions': 'off', // Require or disallow padding within blocks
    'no-unused-vars': 'off', // Require or disallow padding within blocks
    'linebreak-style': 0, // Enforce consistent linebreak style
    'object-curly-spacing': ['error', 'always'], // Enforce consistent spacing inside braces
    'indent': 0, // Enforce consistent indentation
    'no-plusplus': 'off', // Disallow the unary operators ++ and --
    'arrow-body-style': ["error", "as-needed"], // Require braces in arrow function body
    'node/no-unsupported-features/node-builtins': 'off',
    'semi': [2, "never"],
    "comma-dangle": ["error", {
      "arrays": "always-multiline",
      "objects": "always-multiline",
      "imports": "never",
      "exports": "never",
      "functions": "always-multiline",
    }],
  },
}
