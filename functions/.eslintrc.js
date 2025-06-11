// functions/.eslintrc.js

module.exports = {
  // AQUI ESTÁ A CORREÇÃO:
  // Adicionamos esta seção 'env' para dizer ao ESLint
  // que nosso código roda em um ambiente Node.js e usa
  // as funcionalidades do ES2017.
  "env": {
    "es2017": true,
    "node": true,
  },
  "extends": [
    "eslint:recommended",
    "google",
  ],
  "parserOptions": {
    "ecmaVersion": 2020, // Usamos uma versão mais moderna do EcmaScript
  },
  "rules": {
    "quotes": ["error", "double"],
  },
};