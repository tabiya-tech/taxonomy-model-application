export interface IConfiguration {
  dbURI: string;
  resourcesBaseUrl: string;
}
export function getConfiguration(): IConfiguration {
  return  {
    dbURI: process.env.MONGODB_URI || "",
    resourcesBaseUrl: process.env.RESOURCES_BASE_URL || ""
  };
}
export function getDbURI(){
  return getConfiguration().dbURI;
}

export function getResourcesBaseUrl(){
  return getConfiguration().resourcesBaseUrl;
}