/** @type {import('ts-jest').JestConfigWithTsJest} */
const baseConfig = require("./jest.config");

module.exports = {
  ...baseConfig,
  testPathIgnorePatterns: ["<rootDir>/build", "<rootDir>/coverage", "<rootDir>/deploy", "<rootDir>/src"],
  testMatch: ["<rootDir>/test/**/*.integration.test.ts"],
};
