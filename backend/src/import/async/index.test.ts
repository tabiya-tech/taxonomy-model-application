//mute console.log
import "_test_utilities/consoleMock";

// ##############
// Mock the configuration
jest.mock("server/config/config", () => {
  const mockConfiguration = {
    dbURI: "mongodb://username@password:server:port/database",
    resourcesBaseUrl: "https://path/to/resource",
    uploadBucketName: "bucket name",
    uploadBucketRegion: "bucket region",
    asyncLambdaFunctionRegion: "async function region",
    asyncLambdaFunctionArn: "function arn"
  }
  return {
    getUploadBucketName: jest.fn().mockImplementation(() => {
      return mockConfiguration.uploadBucketName;
    }),
    getUploadBucketRegion: jest.fn().mockImplementation(() => {
      return mockConfiguration.uploadBucketRegion;
    }),
  }
});

// Mock the init function
jest.mock("server/init", () => {
  const originalModule = jest.requireActual("server/init");
  return {
    ...originalModule,
    initOnce: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    })
  };
});

// Mock the S3PresignerService

const mockS3PresignerServiceInstance = {
  getPresignedGet: jest.fn().mockImplementation((filePath: string) => {
    return Promise.resolve(`presigned url for ${filePath}`);
  })
};

jest.mock('./S3PresignerService', () => {
  return {
    S3PresignerService: jest.fn().mockReturnValue(mockS3PresignerServiceInstance)
  };
});

// Mock the ISCOGroupsParser
jest.mock("import/ISCOGroups/ISCOGroupsParser", () => {
  return {
    parseISCOGroupsFromUrl: jest.fn().mockResolvedValue(undefined)
  }
});
// ##############

import * as asyncIndex from "./index";
import {ImportRequest} from "api-specifications/import";
import {ImportFileTypes} from "api-specifications/import";

import {initOnce} from "server/init";
import {getMockId} from "_test_utilities/mockMongoId";
import {parseISCOGroupsFromUrl} from "import/ISCOGroups/ISCOGroupsParser";
import {getUploadBucketName, getUploadBucketRegion} from "server/config/config";
import {S3PresignerService} from "./S3PresignerService";

describe("Test the main async handler", () => {
  beforeEach(
    () => {
      jest.clearAllMocks();
    }
  )
  test("should successfully import", async () => {
    // GIVEN some configuration
    const givenUploadBucketRegion = getUploadBucketRegion();
    const givenUploadBucketName = getUploadBucketName();
    // AND an ImportRequest
    const givenEvent: ImportRequest = {
      filePaths: {
        [ImportFileTypes.ISCO_GROUP]: "path/to/ISCO_GROUP.csv",
        // ADD additional file types here
      },
      modelId: getMockId(1)
    }

    // WHEN calling the handler with the given event
    await asyncIndex.handler(givenEvent);

    // THEN expect the initOnce function to have been called
    expect(initOnce).toBeCalledTimes(1);
    // AND expect the S3PresignerService to have been instantiated with the correct region and bucket name
    expect(S3PresignerService).toHaveBeenCalledWith(givenUploadBucketRegion, givenUploadBucketName);
    // AND for each of the givenEvent.filePaths to call the correct processing function with the giveModelId and the presigned URL for the file path
    for (const entry of Object.entries(givenEvent.filePaths)) {
      const fileType = entry[0];
      const presignedUrl = await mockS3PresignerServiceInstance.getPresignedGet(entry[1]);
      switch (fileType){
        case  ImportFileTypes.ISCO_GROUP:
          expect(parseISCOGroupsFromUrl).toHaveBeenCalledWith(givenEvent.modelId, presignedUrl);
          break;
        // ADD additional file types here
      }
    }
  })

  test("should throw error if event does not conform to schema", async () => {
    // GIVEN an event that does not conform to the  ImportRequest schema
    //@ts-ignore
    const givenBadEvent: ImportRequest = {foo: "foo"} as ImportRequest;

    // WHEN the main handler is invoked with the given event
    const promiseHandler = asyncIndex.handler(givenBadEvent);

    // THEN expect to reject with an error
    await expect(promiseHandler).rejects.toThrowError("Import failed, the event does not conform to the expected schema");
  });
})