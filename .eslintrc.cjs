module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    ecmaVersion: 'latest',
    parser: '@typescript-eslint/parser',
    sourceType: 'module'
  },
  plugins: ['vue', '@typescript-eslint'],
  rules: {
    // Vue 规则
    'vue/multi-word-component-names': 'off', // 允许单词组件名
    'vue/no-v-html': 'warn', // 警告 v-html 使用（XSS 风险）
    'vue/require-default-prop': 'off', // 不强制默认 prop
    'vue/require-explicit-emits': 'warn', // 建议显式声明 emits
    'vue/component-api-style': ['error', ['script-setup']], // 强制使用 script setup
    'vue/no-parsing-error': 'off', // 关闭模板解析错误（误报）

    // TypeScript 规则
    '@typescript-eslint/no-explicit-any': 'warn', // 警告 any 类型
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^(error|e|err|_)$' // 忽略 catch 中的 error 变量
      }
    ],
    '@typescript-eslint/no-var-requires': 'off', // 允许 require（后端代码）
    '@typescript-eslint/no-require-imports': 'off', // 允许 require

    // JS 规则
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-unused-vars': 'off', // 使用 TypeScript 的规则
    'prefer-const': 'warn',
    'no-var': 'error',
    'no-empty': 'warn', // 空块警告而非错误
    'no-unreachable': 'warn', // 不可达代码警告
    'no-useless-escape': 'warn', // 不必要的转义警告
    'no-undef': 'off' // 关闭（TypeScript 会处理）
  },
  overrides: [
    {
      // 后端文件使用 CommonJS 规则
      files: [
        '**/*.cjs',
        'server.cjs',
        'routes/**/*.js',
        'services/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js'
      ],
      rules: {
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-require-imports': 'off'
      }
    },
    {
      // 前端 Vue 文件
      files: ['**/*.vue'],
      rules: {
        'vue/multi-word-component-names': 'off'
      }
    }
  ]
}
