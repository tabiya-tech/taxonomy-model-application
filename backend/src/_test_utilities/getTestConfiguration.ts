import { IConfiguration } from "server/config/config";

export function getTestConfiguration(dbname: string): IConfiguration {
  return {
    dbURI: process.env.MONGODB_URI + dbname, //use a dedicated DB for this test to avoid conflicts with other test
    resourcesBaseUrl: "https://path/to/resources",
    uploadBucketRegion: "us-east-1",
    uploadBucketName: "test-bucket",
    asyncLambdaFunctionArn: "arn:aws:lambda:foo:bar:baz",
    asyncLambdaFunctionRegion: "foo",
  };
}
