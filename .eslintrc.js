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
        "memberVariableDeclaration": true,
        "no-inferrable-types": true
      }
    ],
    "@typescript-eslint/explicit-member-accessibility": ["error"],
    "no-inferrable-types": [0, "always"],
    "semi": [2, "always"],
    "quotes": ["error", "single"],
    "space-before-function-paren": [2, "never"],
    "comma-spacing": ["error", { "before": false, "after": true }]
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
