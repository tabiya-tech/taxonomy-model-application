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
    createPresignedPost: jest.fn().mockResolvedValue({
      url: "https://some/path/to/bucket",
      fields: {"key": "value", "key1": "value", "key2": "value2"}
    })
  }
});
// ####

import * as config from "server/config/config";
import * as handlerModule from "./index";
import {HTTP_VERBS, StatusCodes} from "server/httpUtils";
import Ajv from "ajv";
import Presigned from "api-specifications/presigned";
import addFormats from "ajv-formats";

describe('test main handler by mocking the aws S3', () => {
  it("GET should respond with the OK and response passes the JSON Schema validation", async () => {
    // GIVEN a region & a bucketName have been configured
    const givenRegion = "foo";
    const givenBucketName = "bar";
    jest.spyOn(config, "getUploadBucketRegion").mockReturnValue(givenRegion);
    jest.spyOn(config, "getUploadBucketName").mockReturnValue(givenBucketName);
    // AND a GET event
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
    }

    // WHEN the main handler is called with the given event
    // @ts-ignore
    const actualResponse = await handlerModule.handler(givenEvent);

    // THEN expect the handler to respond with status OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND to return the correct headers
    expect(actualResponse.headers).toMatchObject({"Content-Type": "application/json"});
    // AND the body should successfully validate against the PresignedSchema schema
    const expectedAjv = new Ajv({validateSchema: true, strict: true, allErrors: true});
    addFormats(expectedAjv);
    const validateResponse = expectedAjv.compile(Presigned.GET.Response.Schema);
    validateResponse(JSON.parse(actualResponse.body));
    expect(validateResponse.errors).toBeNull();
  });
});
