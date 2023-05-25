import {
  DESCRIPTION_MAX_LENGTH,
  IModelInfo,
  NAME_MAX_LENGTH,
  RELEASE_NOTES_MAX_LENGTH,
  SHORTCODE_MAX_LENGTH,
  VERSION_MAX_LENGTH
} from "./modelInfoModel";
import {getMockId} from "../_test_utilities/mockMongoId";
import {randomUUID} from "crypto";
import {getRandomString} from "../_test_utilities/specialCharacters";
import {IConfiguration} from "server/config/config";

export function getIModelInfoMockData(): IModelInfo {
  return {
    id: getMockId(1),
    UUID: randomUUID(),
    previousUUID: randomUUID(),
    originUUID: randomUUID(),
    name: getRandomString(NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getRandomString(NAME_MAX_LENGTH),
      shortCode: getRandomString(SHORTCODE_MAX_LENGTH)
    },
    description: getRandomString(DESCRIPTION_MAX_LENGTH),
    released: false,
    releaseNotes: getRandomString(RELEASE_NOTES_MAX_LENGTH),
    version: getRandomString(VERSION_MAX_LENGTH),
    createdAt: new Date(1973, 11, 17, 0, 0, 0), //.toISOString(),
    updatedAt: new Date() //.toISOString()
  };
}


export function getTestConfiguration(dbname: string): IConfiguration {
  return {
    dbURI: process.env.MONGODB_URI + dbname, //use a dedicated DB for this test to avoid conflicts with other test
    resourcesBaseUrl: "https://path/to/resources",
    uploadBucketRegion: "us-east-1",
    uploadBucketName: "test-bucket",
    asyncLambdaFunctionArn: "arn:aws:lambda:foo:bar:baz",
    asyncLambdaFunctionRegion: "foo"
  };
}