/** @type {import('ts-jest').JestConfigWithTsJest} */

module.exports = {
  modulePaths: ["<rootDir>/src"],
  testPathIgnorePatterns : [
    "<rootDir>/build",
    "<rootDir>/coverage",
    "<rootDir>/deploy",
    "<rootDir>/src",
  ],
  modulePathIgnorePatterns: ["<rootDir>/build"],
  moduleDirectories: ["node_modules"],
  preset:"ts-jest",
  testEnvironment: "node"
};