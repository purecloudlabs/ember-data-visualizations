module.exports = {
    root: true,
    parserOptions: {
        ecmaVersion: 2017,
        sourceType: 'module'
    },
    extends: [
        'eslint:recommended',
        'plugin:ember/recommended',
        'plugin:ember-suave/recommended'
    ],
    env: {
        browser: true
    },
    rules: {
        'ember-suave/no-const-outside-module-scope': 'off',
        'ember-suave/no-direct-property-access': 'off',
        'ember-suave/prefer-destructuring': 'off',
        'ember/avoid-leaking-state-in-ember-objects': 'off',
        'arrow-parens': 'off',
        'one-var': 'off',
        'indent': ['error', 4],
        'space-before-function-paren': ['error', {
            'anonymous': 'always',
            'named': 'never'
        }]
    }
};
