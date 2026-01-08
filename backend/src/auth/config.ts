export const ENV_VAR_NAMES = {
  MONGODB_URI: "AUTH_DATABASE_URI",
  USER_POOL_ID: "USER_POOL_ID",
  USER_POOL_CLIENT_ID: "USER_POOL_CLIENT_ID",
};

export interface IConfiguration {
  dbURI: string;
  userPoolId: string;
  userPoolClientId: string;
}

export function readEnvironmentConfiguration(): IConfiguration {
  return {
    dbURI: process.env[ENV_VAR_NAMES.MONGODB_URI] ?? "",
    userPoolId: process.env[ENV_VAR_NAMES.USER_POOL_ID] ?? "",
    userPoolClientId: process.env[ENV_VAR_NAMES.USER_POOL_CLIENT_ID] ?? "",
  };
}

let _configuration: IConfiguration | undefined;
export function getConfiguration(): IConfiguration | undefined {
  return _configuration;
}

export function setConfiguration(config: IConfiguration) {
  _configuration = config;
}

export function getDbURI() {
  return _configuration?.dbURI ?? "";
}

export function getUserPoolId() {
  return _configuration?.userPoolId ?? "";
}

export function getUserPoolClientId() {
  return _configuration?.userPoolClientId ?? "";
}
