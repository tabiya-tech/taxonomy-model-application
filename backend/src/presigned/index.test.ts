// ############
// Set up mocks
// Set up crypto.randomUUID mock
import {EXPIRES, MAX_FILE_SIZE} from "./presigned.constants";
import {randomUUID} from "crypto";
import * as config from "server/config/config";
import * as handlerModule from './index';
import {APIGatewayProxyEvent} from 'aws-lambda';
import {HTTP_VERBS, StatusCodes, STD_ERRORS_RESPONSES} from "server/httpUtils";
import * as awsSDKServiceModule from "./awsSDKService";
import * as transformModule from "./transform";
import {testMethodsNotAllowed} from "../_test_utilities/stdRESTHandlerTests";

jest.mock("crypto", () => {
  const actual = jest.requireActual("crypto");
  return {
    ...actual,
    randomUUID: jest.fn().mockImplementation(actual.randomUUID)
  }
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe('test main handler', () => {

  it("GET should respond with whatever the getPresigned function returns", async () => {
    // GIVEN a GET event
    const givenEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.GET,
    } as any;
    // AND the getPresigned() function returns some response
    const givenResponse = {foo: "foo"} as any;
    jest.spyOn(handlerModule, "getPreSigned").mockReturnValueOnce(givenResponse);

    // WHEN the main handler is called with the given event
    const actualResponse = await handlerModule.handler(givenEvent);

    // THEN expect the handler to return the response that the getPresigned function returned
    expect(actualResponse).toEqual(givenResponse);
  });
  
  testMethodsNotAllowed([
    HTTP_VERBS.POST,
    HTTP_VERBS.PUT,
    HTTP_VERBS.DELETE,
    HTTP_VERBS.PATCH,
    HTTP_VERBS.OPTIONS
  ], handlerModule.handler);

});

describe('test getPreSigned()', () => {
  it("should respond with OK and the pre-signed data in the body", async () => {
    // GIVEN a region & a bucketName have been configured
    const givenRegion = "foo";
    const givenBucketName = "bar";
    jest.spyOn(config, "getUploadBucketRegion").mockReturnValue(givenRegion);
    jest.spyOn(config, "getUploadBucketName").mockReturnValue(givenBucketName);
    // AND a randomKey
    const givenRandomKey = "baz";
    (randomUUID as jest.Mock).mockReturnValue(givenRandomKey);
    // AND the awsSDKServiceModule will return some pre-signed post data
    const givenPreSignedPost = {foo: "foo"} as any
    jest.spyOn(awsSDKServiceModule, "s3_getPresignedPost").mockResolvedValue(givenPreSignedPost);
    // AND the transform() function will transform the post data
    const givenPresignedResponse = {bar: "bar"} as any
    const transformSpy = jest.spyOn(transformModule, "transformPresignedPostDataToResponse").mockReturnValue(givenPresignedResponse);

    // WHEN getPreSigned() is called
    const actualResponse = await handlerModule.getPreSigned();

    // THEN expect that the getPreSigned function has called the awsSDKServiceModule.s3_getPresignedPost()
    // with the given region, bucket name, random key, MAX_FILE_SIZE and EXPIRES
    expect(awsSDKServiceModule.s3_getPresignedPost).toHaveBeenCalledWith(givenRegion, givenBucketName, givenRandomKey, MAX_FILE_SIZE, EXPIRES);

    // AND has called the transformModule.transformPostData() with the given pre-signed post data
    expect(transformModule.transformPresignedPostDataToResponse).toHaveBeenCalledWith(givenPreSignedPost, givenRandomKey);

    // AND it responds with OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the response should have the correct headers
    expect(actualResponse.headers).toMatchObject({"Content-Type": "application/json"});
    // AND the response body has the result of the transformation function
    expect(JSON.parse(actualResponse.body)).toMatchObject(transformSpy.mock.results[0].value);
  });

  it("should return a INTERNAL_SERVER_ERROR response when getPreSigned() throws an error", async () => {
    // GIVEN a GET event
    const mockEvent: APIGatewayProxyEvent = {
      httpMethod: HTTP_VERBS.GET,
    } as any;
    // AND awsSDKServiceModule.s3_getPresignedPost() will throw an error
    jest.spyOn(awsSDKServiceModule, "s3_getPresignedPost").mockRejectedValue(new Error("foo"));

    // WHEN the main handler is called with the given  event
    const actualResponse = await handlerModule.handler(mockEvent);

    // THEN expect the actual response to be INTERNAL_SERVER_ERROR
    expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR);
  });
});
