module.exports = {
  env: {
    node: true,
    es6: true,
    jest: true
  },
  extends: [
    'standard'
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module'
  },
  rules: {
    "semi": [2, "always"],
    "space-before-function-paren": [2, "never"]
  }
}
