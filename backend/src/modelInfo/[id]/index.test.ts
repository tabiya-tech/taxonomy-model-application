// silence chatty console
import "_test_utilities/consoleMock";

// Mock the PATCH handler so we can observe the dispatch
const mockHandle = jest.fn();
jest.mock("./PATCH", () => ({
  ModelPATCHHandler: jest.fn().mockImplementation(() => ({ handle: mockHandle })),
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

  testMethodsNotAllowed(
    [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.POST, HTTP_VERBS.GET],
    ModelInstanceHandler.handler
  );

  test("should not delegate to the PATCH handler for non-PATCH methods", async () => {
    // GIVEN a GET event
    const givenEvent = { httpMethod: HTTP_VERBS.GET } as APIGatewayProxyEvent;

    // WHEN the handler is invoked with the given event
    const actualResponse = await ModelInstanceHandler.handler(givenEvent);

    // THEN expect the PATCH handler to not be invoked
    expect(mockHandle).not.toHaveBeenCalled();
    // AND expect a METHOD_NOT_ALLOWED response
    expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
  });
});
