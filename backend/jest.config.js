/** @type {import('ts-jest').JestConfigWithTsJest} */
const {compilerOptions} = require('./tsconfig.json')

module.exports = {
  modulePaths: [`<rootDir>/src`],
  testPathIgnorePatterns : [
    "<rootDir>/build",
    "<rootDir>/coverage",
    "<rootDir>/deploy",
  ],
  modulePathIgnorePatterns: ['<rootDir>/build'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  transform: { // override default transform to use a custom inline tsconfig
    // process js/ts with `ts-jest`
    '^.+\\.[tj]s$': [
      'ts-jest', {
        tsconfig: {
          ...compilerOptions,
          sourceMap: true, // enable sourcemap to allow proper code coverage of imports in ts files
        },
      }
    ],
  },
  testEnvironment: 'node',
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}"
  ],
};