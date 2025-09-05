/** @type {import('ts-jest').JestConfigWithTsJest} */
const {compilerOptions} = require('./tsconfig.json')
module.exports = {
  testPathIgnorePatterns: [
    "<rootDir>/dist",
    "<rootDir>/coverage",
  ],
  modulePathIgnorePatterns: ["<rootDir>/build", "<rootDir>/dist"],
  moduleDirectories: ["node_modules", "<rootDir>/src"],
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
  testEnvironment: "node",
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/_test_utilities/*"
  ],
  "coverageReporters": [
    ["lcov", {"projectRoot": "../"}],
    "text"
  ]
};