/** @type {import('ts-jest').JestConfigWithTsJest} */
const {compilerOptions} = require('./tsconfig.json')
const mongodbPreset = require('@shelf/jest-mongodb/jest-preset')
module.exports = {

  preset: '@shelf/jest-mongodb',
  testPathIgnorePatterns: [
    "<rootDir>/build",
    "<rootDir>/coverage",
    "<rootDir>/deploy",
    "<rootDir>/test"
  ],
  modulePathIgnorePatterns: ["<rootDir>/build"],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
  transform: { // override default transform to use a custom inline tsconfig
    // process js/ts with `ts-jest`
    '^.+\\.ts$': [
      'ts-jest', {
        tsconfig: {
          ...compilerOptions,
          sourceMap: true, // enable sourcemap to allow proper code coverage of imports in ts files
        },
      }
    ],
  },
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/_test_utilities/*",
    "!src/**/_test_data_/*",
    "!*.json",
  ],
  "coverageReporters": [
    ["lcov", {"projectRoot": "../"}],
    "text"
  ],
  ...mongodbPreset,
};