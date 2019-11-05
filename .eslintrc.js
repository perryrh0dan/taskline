module.exports = {
  parser: '@typescript-eslint/parser', // Specifies the ESLint parser
  plugins: ["@typescript-eslint"],
  // extends: [
  //   'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  // ],
  parserOptions: {
    ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
    sourceType: 'module', // Allows for the use of imports
  },
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly'
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": ["error"],
    "@typescript-eslint/typedef": [
      "error",
      {
        "arrowParameter": false,
        "variableDeclaration": false,
        "call-signature": true,
        "property-declaration": true,
        "no-inferrable-types": true
      }
    ],
    "no-inferrable-types": [0, "always"],
    "semi": [2, "always"],
    "space-before-function-paren": [2, "never"]
  },
  overrides: [
    {
      files: "*.js",
      rules: {
        "@typescript-eslint/explicit-function-return-type": ["off"]
      }
    }
  ]
}
