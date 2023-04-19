// ####
// Set up the mock for the S3Client

jest.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: jest.fn()
  }
});
// Set up the mock for the createPresignedPost
jest.mock("@aws-sdk/s3-presigned-post", () => {
  return {
    createPresignedPost: jest.fn().mockResolvedValue({url: "https://some/path/to/bucket", fields: {"key": "value", "key1": "value", "key2": "value2"}})
  }
});
// ####

import * as config from "../server/config/config";
import * as handlerModule from "./index";
import {HTTP_VERBS, StatusCodes} from "../server/httpUtils";
import Ajv from "ajv";
import {PresignedResponseSchema} from "api-specifications/presigned";
import addFormats from "ajv-formats";

describe('test main handler by mocking the aws S3', () => {
  it("GET should respond with the OK and response passes the JSON Schema validation", async () => {
    // GIVEN a given region from the configuration
    const givenRegion = "foo";
    //@ts-ignore
    jest.spyOn(config, "getUploadBucketRegion").mockReturnValue(givenRegion);
    // AND a given bucket name from the configuration
    const givenBucketName = "bar";
    //@ts-ignore
    jest.spyOn(config, "getUploadBucketName").mockReturnValue(givenBucketName);

    // AND a GET event
    const mockEvent= {
      httpMethod: HTTP_VERBS.GET,
    }
    // WHEN getPreSigned() is called
    // @ts-ignore
    const actualResponse = await handlerModule.handler(mockEvent);

    // THEN expect to respond with status OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND expect the handler to return the correct headers
    expect(actualResponse.headers).toMatchObject({"Content-Type": "application/json"});
    // AND it should the response body should validate against the PresignedResponseSchema schema
    const ajv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(ajv);
    const validateResponse = ajv.compile(PresignedResponseSchema);
    validateResponse(JSON.parse(actualResponse.body));
    expect(validateResponse.errors).toBeNull();
  });
});
