import { IConfiguration } from "server/config/config";

export function getTestConfiguration(dbname: string): IConfiguration {
  return {
    dbURI: process.env.MONGODB_URI + dbname, //use a dedicated DB for this test to avoid conflicts with other test
    domainName: "https://path/to/domain",
    resourcesBaseUrl: "https://path/to/resources",
    uploadBucketRegion: "us-east-1",
    uploadBucketName: "test-upload-bucket",
    downloadBucketRegion: "us-east-2",
    downloadBucketName: "test-download-bucket",
    asyncImportLambdaFunctionArn: "arn:aws:lambda:foo:bar:baz:import",
    asyncExportLambdaFunctionArn: "arn:aws:lambda:foo:bar:baz:export",
    asyncLambdaFunctionRegion: "foo",
  };
}
