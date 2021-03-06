module.exports = {
  collectCoverageFrom: [
    'packages/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/demo/**',
    '!**/extensions/**/dist/**',
    '!**/extensions/**/es/**',
    '!**/extensions/**/lib/**',
    '!packages/lib/**/lib/**',
    '!packages/lib/**/es/**',
    '!**/coverage/**',
    '!**/jest/**',
    '!**/jestMocks/**',
    '!**/scripts/**',
    '!**/config/**',
    '!**/build/**',
    '!**/dist/**',
    '!**/*config.js',
    '!**/gulpfile.js',
    '!**/style.js',
    '!**/styles.js',
    '!cypress/',
  ],
  coverageReporters: ['json', 'lcov', 'text-summary', 'cobertura'],
  coverageThreshold: {
    global: {
      statements: 20,
    },
  },
  moduleNameMapper: {
    // Any imports of .scss / .css files will instead import styleMock.js which is an empty object
    '\\.(jpg|jpeg|png|svg)$': '<rootDir>/jestMocks/styleMock.js',
    '\\.(s)?css$': '<rootDir>/jestMocks/styleMock.js',
  },
  testPathIgnorePatterns: ['/node_modules/', '/scripts/', '/jestMocks/', '__tests__/setup.(j|t)s', '/cypress/'],
  projects: [
    '<rootDir>/packages/client',
    '<rootDir>/packages/server',
    '<rootDir>/packages/extensions/obiformeditor',
    '<rootDir>/packages/extensions/visual-designer',
    '<rootDir>/packages/lib/code-editor',
    '<rootDir>/packages/lib/shared',
  ],
};
