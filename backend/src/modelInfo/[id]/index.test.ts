// silence chatty console
import "_test_utilities/consoleMock";

// Mock the PATCH handler so we can observe the dispatch
const mockHandle = jest.fn();
jest.mock("./PATCH", () => ({
  ModelPATCHHandler: jest.fn().mockImplementation(() => ({ handle: mockHandle })),
}));
// Mock the GET handler the same way, so we can observe whether the router delegates to it
const mockHandleGET = jest.fn();
jest.mock("./GET", () => ({
  ModelGETHandler: jest.fn().mockImplementation(() => ({ handle: mockHandleGET })),
}));

import * as ModelInstanceHandler from "./index";
import { HTTP_VERBS, response, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { testMethodsNotAllowed } from "_test_utilities/stdRESTHandlerTests";

describe("Test the ModelInstance handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("PATCH should delegate to the ModelPATCHHandler", async () => {
    // GIVEN a PATCH event
    const givenEvent = { httpMethod: HTTP_VERBS.PATCH } as APIGatewayProxyEvent;
    // AND the PATCH handler will return a response
    const givenResponse = response(StatusCodes.OK, {});
    mockHandle.mockResolvedValueOnce(givenResponse);

    // WHEN the handler is invoked with the given event
    const actualResponse = await ModelInstanceHandler.handler(givenEvent);

    // THEN expect the PATCH handler to be invoked with the given event
    expect(mockHandle).toHaveBeenCalledWith(givenEvent);
    // AND the handler to return the response from the PATCH handler
    expect(actualResponse).toEqual(givenResponse);
  });

  test("GET should delegate to the ModelGETHandler", async () => {
    // GIVEN a GET event
    const givenEvent = { httpMethod: HTTP_VERBS.GET } as APIGatewayProxyEvent;
    // AND the GET handler will return a response
    const givenResponse = response(StatusCodes.OK, {});
    mockHandleGET.mockResolvedValueOnce(givenResponse);

    // WHEN the handler is invoked with the given event
    const actualResponse = await ModelInstanceHandler.handler(givenEvent);

    // THEN expect the GET handler to be invoked with the given event
    expect(mockHandleGET).toHaveBeenCalledWith(givenEvent);
    // AND the handler to return the response from the GET handler
    expect(actualResponse).toEqual(givenResponse);
  });

  // GET is no longer in this list because it is now a supported method
  testMethodsNotAllowed(
    [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.POST],
    ModelInstanceHandler.handler
  );

  test("should not delegate to any handler for unsupported methods", async () => {
    // GIVEN an event with an unsupported method (PUT, since GET and PATCH are supported)
    const givenEvent = { httpMethod: HTTP_VERBS.PUT } as APIGatewayProxyEvent;

    // WHEN the handler is invoked with the given event
    const actualResponse = await ModelInstanceHandler.handler(givenEvent);

    // THEN expect neither the PATCH nor the GET handler to be invoked
    expect(mockHandle).not.toHaveBeenCalled();
    expect(mockHandleGET).not.toHaveBeenCalled();
    // AND the handler to respond with METHOD_NOT_ALLOWED
    expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
  });
});
