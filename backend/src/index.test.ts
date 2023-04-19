import * as MainHandler from "./index";
import * as InfoHandler from "./info/index";
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {response, STD_ERRORS_RESPONSES} from "./httpUtils";

afterEach(() => {
  jest.restoreAllMocks();
});

describe("test the main handler function", () => {
  test("should return the response from the handleRouteEvent function", async () => {
    //GIVEN some event
    const givenEvent = {event: ""};
    // AND some context
    const givenContext = {context: ""};
    // AND some callback
    const givenCallback = jest.fn();
    //AND the handleRouteEvent returns a response
    const givenResponse = response(200, {foo: "bar"});

    //WHEN the main handler is called
    // @ts-ignore
    const handleRouteEventSpy = jest.spyOn(MainHandler, "handleRouteEvent").mockImplementation(() => {
      return Promise.resolve(givenResponse);
    });
    // @ts-ignore
    const actualResponse = await MainHandler.handler(givenEvent, givenContext, givenCallback);

    //THEN expect the handleRouteEvent to be called with the given event, context and callback
    expect(handleRouteEventSpy).toBeCalledWith(givenEvent, givenContext, givenCallback);
    // AND the main handler to return the response from the handleRouteEvent
    expect(actualResponse).toEqual(givenResponse);
  });

  test("should return INTERNAL_SERVER_ERROR if handleRouteEvent throws an error", async () => {
    // GIVEN the handleRouteEvent throws an error
    jest.spyOn(MainHandler, "handleRouteEvent").mockImplementation(() => {
      throw new Error();
    });

    // WHEN the main handler is called
    // @ts-ignore
    const actualResponse = await MainHandler.handler(null, null, null);

    // THEN expect an internal server error response
    expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR);
  });
});

describe("test the handleRouteEvent function", () => {

  test("should call Info handler if path is /info", async () => {
    // GIVEN a path that is /info
    // AND any method
    const expectedEvent = {
      path: "/info",
    }
    // AND The Info Handler returns a response
    const expectedResponse = {
      foo: "bar"
    }
    // WHEN the handleRouteEvent is called
    // @ts-ignore
    const infoHandlerSpy = jest.spyOn(InfoHandler, "handler").mockImplementation(() => {
        return Promise.resolve(expectedResponse);
      }
    );
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(expectedEvent, null, null);

    // THEN expect Info handler to be called with event
    expect(infoHandlerSpy).toBeCalledWith(expectedEvent, null, null);
    // AND the main handler to return the response from the Info handler
    expect(actualResponse).toEqual(expectedResponse);
  });

  test.each([null, undefined, "/foo", "foo", "", "/"])("should return NOT FOUND if path is '%s'", async (path) => {
    // GIVEN a path that is not defined
    // AND any method

    const expectedEvent = {
      path: path,
    }
    // WHEN the handleRouteEvent is called
    // @ts-ignore
    const actualResponse: APIGatewayProxyResult = await MainHandler.handleRouteEvent(expectedEvent, null, null);

    // THEN expect response to be NOT FOUND
    expect(actualResponse).toBe(STD_ERRORS_RESPONSES.NOT_FOUND);
  });
});