/* eslint-disable */
export default {
  displayName: 'work-whiz',
  preset: './jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: './coverage/work-whiz',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.[jt]s?(x)',
    '<rootDir>/src/**/*(*.)@(spec|test).[jt]s?(x)',
  ],
  reporters: [
    'default',
    [
      'jest-stare',
      {
        resultDir: 'jest-stare',
        reportTitle: 'jest-stare!',
        additionalResultsProcessors: ['jest-junit'],
        coverageLink: '../../coverage/lcov-report/index.html',
        jestStareConfigJson: 'jest-stare.json',
        jestGlobalConfigJson: 'globalStuff.json',
      },
    ],
  ],
};
