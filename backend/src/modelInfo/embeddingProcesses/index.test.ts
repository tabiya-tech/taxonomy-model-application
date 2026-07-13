// silence chatty console
import "_test_utilities/consoleMock";

// Mock the POST handler so we can observe the dispatch
const mockHandle = jest.fn();
jest.mock("./POST", () => ({
  POSTModelEmbeddingProcessesHandler: jest.fn().mockImplementation(() => ({ handle: mockHandle })),
}));

import * as ModelEmbeddingProcessesHandler from "./index";
import { HTTP_VERBS, response, StatusCodes, STD_ERRORS_RESPONSES } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { testMethodsNotAllowed } from "_test_utilities/stdRESTHandlerTests";

describe("Test the ModelEmbeddingProcesses handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("POST should delegate to the POSTModelEmbeddingProcessesHandler", async () => {
    // GIVEN a POST event
    const givenEvent = { httpMethod: HTTP_VERBS.POST } as APIGatewayProxyEvent;
    // AND the POST handler will return a response
    const givenResponse = response(StatusCodes.ACCEPTED, {});
    mockHandle.mockResolvedValueOnce(givenResponse);

    // WHEN the handler is invoked with the given event
    const actualResponse = await ModelEmbeddingProcessesHandler.handler(givenEvent);

    // THEN expect the POST handler to be invoked with the given event
    expect(mockHandle).toHaveBeenCalledWith(givenEvent);
    // AND the handler to return the response from the POST handler
    expect(actualResponse).toEqual(givenResponse);
  });

  testMethodsNotAllowed(
    [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH, HTTP_VERBS.GET],
    ModelEmbeddingProcessesHandler.handler
  );

  test("should not delegate to the POST handler for non-POST methods", async () => {
    // GIVEN a GET event
    const givenEvent = { httpMethod: HTTP_VERBS.GET } as APIGatewayProxyEvent;

    // WHEN the handler is invoked with the given event
    const actualResponse = await ModelEmbeddingProcessesHandler.handler(givenEvent);

    // THEN expect the POST handler to not be invoked
    expect(mockHandle).not.toHaveBeenCalled();
    // AND expect a METHOD_NOT_ALLOWED response
    expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.METHOD_NOT_ALLOWED);
  });
});
