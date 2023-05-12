export interface IConfiguration {
  dbURI: string;
  resourcesBaseUrl: string;
}
export function readEnvironmentConfiguration(): IConfiguration {
  return  {
    dbURI: process.env.MONGODB_URI || "",
    resourcesBaseUrl: process.env.RESOURCES_BASE_URL || ""
  };
}

let _configuration: IConfiguration | undefined;
export function getConfiguration(): IConfiguration | undefined {
  return _configuration;
}

export function setConfiguration(config: IConfiguration) {
  _configuration = config;
}

export function getDbURI(){
  return _configuration?.dbURI  || "";
}

export function getResourcesBaseUrl(){
  return _configuration?.resourcesBaseUrl || "";
}