/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  setupFilesAfterEnv: ["jest-extended/all"],
  modulePaths: ["<rootDir>/src"],
  testPathIgnorePatterns: ["<rootDir>/build", "<rootDir>/coverage", "<rootDir>/deploy", "<rootDir>/src"],
  testMatch: ["<rootDir>/test/e2e/**/*.test.ts"],
  moduleDirectories: ["node_modules"],
  preset: "ts-jest",
  testEnvironment: "node",
};
