// ############
// Set up mocks
// Set up crypto.randomUUID mock
import {EXPIRES, MAX_FILE_SIZE} from "./presigned.constants";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});

// ############

import {randomUUID} from "crypto";
import * as config from "server/config/config";
import * as handlerModule from './index';
import {APIGatewayProxyEvent} from 'aws-lambda';
import {HTTP_VERBS, StatusCodes} from "server/httpUtils";
import * as awsSDKServiceModule from "./awsSDKService";
import * as transformModule from "./transform";

beforeEach(() => {
  jest.clearAllMocks();
});

describe('test main handler', () => {

  it("GET should respond with whatever the getPresigned returns", async () => {
    // GIVEN a GET event
    const mockEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.GET,
    } as any;

    // AND getPresigned() returns some response
    const givenResponse = {foo: "foo"} as any;
    jest.spyOn(handlerModule, "getPreSigned").mockReturnValueOnce(givenResponse);

    // WHEN the main handler is called with that event
    const result = await handlerModule.handler(mockEvent);

    // THEN it should return whatever getPreSigned returns
    expect(result).toEqual(givenResponse)
  });

  it.each([
    [HTTP_VERBS.POST],
    [HTTP_VERBS.PUT],
    [HTTP_VERBS.DELETE],
    [HTTP_VERBS.PATCH],
    [HTTP_VERBS.OPTIONS],
  ])("should return a 405 response when HTTP method is %s", async (method) => {
    // GIVEN a GET event
    const mockEvent: APIGatewayProxyEvent = {
      httpMethod: method,
    } as any;

    // WHEN the handler is called with that event
    const result = await handlerModule.handler(mockEvent);

    // THEN it should return a 405 response
    expect(result.statusCode).toBe(StatusCodes.METHOD_NOT_ALLOWED);
  });

});

describe('test getPreSigned()', () => {
  it("should response with OK and the pre-signed data", async () => {
    // GIVEN a given region from the configuration
    const givenRegion = "foo";
    //@ts-ignore
    jest.spyOn(config, "getUploadBucketRegion").mockReturnValue(givenRegion);
    // AND a given bucket name from the configuration
    const givenBucketName = "bar";
    //@ts-ignore
    jest.spyOn(config, "getUploadBucketName").mockReturnValue(givenBucketName);
    // AND a given random
    const givenRandomKey = "baz";
    (randomUUID as jest.Mock).mockReturnValue(givenRandomKey);

    // AND the awsSDKServiceModule will return some pre-signed post data
    const givenPreSignedPost = {foo: "foo"} as any
    jest.spyOn(awsSDKServiceModule, "s3_getPresignedPost").mockResolvedValue(givenPreSignedPost);

    // AND the transform() will transform the post data
    const givenPresignedResponse = {bar: "bar"} as any
    const transformSpy = jest.spyOn(transformModule, "transformPresignedPostDataToResponse").mockReturnValue(givenPresignedResponse);

    // WHEN getPreSigned() is called
    const actualResponse = await handlerModule.getPreSigned();

    // THEN it should call the awsSDKServiceModule.s3_getPresignedPost()
    // with the given region, bucket name, random key, max file size and expires
    expect(awsSDKServiceModule.s3_getPresignedPost).toHaveBeenCalledWith(givenRegion, givenBucketName, givenRandomKey, MAX_FILE_SIZE, EXPIRES);

    // AND it should call the transformModule.transformPostData() with the given pre-signed post data
    expect(transformModule.transformPresignedPostDataToResponse).toHaveBeenCalledWith(givenPreSignedPost, givenRandomKey);

    // AND expect to respond with status CREATED
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND expect the handler to return the correct headers
    expect(actualResponse.headers).toMatchObject({"Content-Type": "application/json"});
    // AND expect the handler to return the result of the transformation function
    expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
  });

  it("should return a INTERNAL_SERVER_ERROR response when getPreSigned() throws an error", async () => {
    // GIVEN a GET event
    const mockEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.GET,
    } as any;

    // AND awsSDKServiceModule throws an error
    jest.spyOn(awsSDKServiceModule, "s3_getPresignedPost").mockRejectedValue(new Error("foo"));

    // WHEN the main handler is called with that event
    const result = await handlerModule.handler(mockEvent);

    // THEN it should return a 500 response
    expect(result.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
  });
});
