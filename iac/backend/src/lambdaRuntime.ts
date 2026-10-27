import * as fs from "fs";

// The repository's .nvmrc is the single source of the Node.js version: CI builds and tests with it,
// and the lambdas run on the matching managed runtime, e.g. "22" -> "nodejs22.x".
const nvmrcPath = "../../.nvmrc";

const nodeMajorVersion = fs.readFileSync(nvmrcPath, "utf-8").trim().replace(/^v/, "").split(".")[0];

if (!/^\d+$/.test(nodeMajorVersion)) {
  throw new Error(`Could not read a Node.js major version from ${nvmrcPath}, got '${nodeMajorVersion}'`);
}

export const LAMBDA_NODEJS_RUNTIME = `nodejs${nodeMajorVersion}.x`;
