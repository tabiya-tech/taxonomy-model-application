/** @type {import('ts-jest').JestConfigWithTsJest} */
const { compilerOptions } = require("./tsconfig.json");
module.exports = {
  moduleDirectories: ["node_modules", "<rootDir>/tests", "<rootDir>/public"],
  transform: {
    // override default transform to use a custom inline tsconfig
    // process js/ts with `ts-jest`
    "^.+\\.ts$": [
      "ts-jest",
      {
        tsconfig: {
          ...compilerOptions,
          sourceMap: true,
        },
      },
    ],
  },
  testEnvironment: "node",
};
