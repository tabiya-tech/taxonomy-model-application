// mute console.log during test
import "_test_utilities/consoleMock";

// ##############
// Setup the configuration mock
const mockConfiguration = {
  dbURI: "mongodb://username@password:server:port/database",
  resourcesBaseUrl: "https://path/to/resource"
}
jest.mock("./server/config/config", () => {
  const originalModule = jest.requireActual("./server/config/config");
  return {
    ...originalModule,
    readEnvironmentConfiguration: jest.fn().mockImplementation(() => {
      return mockConfiguration;
    })
  }
});

// Setup the init mock
jest.mock("./server/init", () => {
  const originalModule = jest.requireActual("./server/init");
  return {
    ...originalModule,
    initOnce: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    })
  };
});
// ##############

import * as MainHandler from "./index";
import * as InfoHandler from "./info/index";
import * as ModelHandler from "./modelInfo/index"
import * as PresignedHandler from "./presigned/index";
import * as ImportHandler from "./import/index"
import {APIGatewayProxyResult} from "aws-lambda/trigger/api-gateway-proxy";
import {response, STD_ERRORS_RESPONSES} from "./server/httpUtils";
import {initOnce} from "./server/init";

describe("test the main handler function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterAll(() => {
    jest.resetAllMocks();
  });

  test("should return the response from the handleRouteEvent function", async () => {
    // GIVEN some event
    const givenEvent = {event: ""};
    // AND some context
    const givenContext = {context: ""};
    // AND some callback
    const givenCallback = jest.fn();
    // AND the handleRouteEvent will successfully handle the event and return a response
    const givenResponse = response(200, {foo: "bar"});
    const givenHandleRouteEventSpy = jest.spyOn(MainHandler, "handleRouteEvent").mockResolvedValue(givenResponse);

    // WHEN the main handler is invoked with the given event, context and callback
    // @ts-ignore
    const actualResponse = await MainHandler.handler(givenEvent, givenContext, givenCallback);

    // THEN expect the handleRouteEvent function to be called with the given event, context and callback
    expect(givenHandleRouteEventSpy).toBeCalledWith(givenEvent, givenContext, givenCallback);
    // AND the main handler to return the response from the handleRouteEvent function
    expect(actualResponse).toEqual(givenResponse);
  });

  test("should return INTERNAL_SERVER_ERROR if handleRouteEvent throws an error", async () => {
    // GIVEN the handleRouteEvent throws an error
    jest.spyOn(MainHandler, "handleRouteEvent").mockImplementation(() => {
      throw new Error();
    });

    // WHEN the main handler is invoked
    // @ts-ignore
    const actualResponse = await MainHandler.handler(null, null, null);

    // THEN expect an internal server error response
    expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR);
  });

  describe("test the initialisation", () => {
    test("should call the initialisation", async () => {
      // GIVEN the handleRouteEvent will successfully handle the event and return a response
      const givenResponse = response(200, {foo: "bar"});
      jest.spyOn(MainHandler, "handleRouteEvent").mockResolvedValue(givenResponse);

      // WHEN the main handler is invoked
      // @ts-ignore
      await MainHandler.handler(null, null, null);

      // THEN expect initOnce to have been called
      expect(initOnce).toBeCalledTimes(1);
    })

    test("should return INTERNAL_SERVER_ERROR if initialisation fails", async () => {
      // GIVEN that initOnce will fail
      (initOnce as jest.Mock).mockRejectedValueOnce(new Error("foo"));
      // AND the handleRouteEvent will successfully handle the event and return a response
      const givenResponse = response(200, {foo: "bar"});
      jest.spyOn(MainHandler, "handleRouteEvent").mockResolvedValue(givenResponse);

      // WHEN the main handler is invoked
      // @ts-ignore
      const actualResponse = await MainHandler.handler(null, null, null);

      // THEN expect initOnce to have been called
      expect(initOnce).toBeCalled()
      // AND an internal server error response
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR);
    })
  });
});

describe("test the handleRouteEvent function", () => {

  test("should call Info handler if path is /info", async () => {
    // GIVEN an event with a path that is /info & any method
    const givenEvent = {
      path: "/info",
    }
    // AND the InfoHandler will successfully handle the event and return a response
    const givenResponse = response(200, {foo: "bar"});
    const givenInfoHandlerSpy = jest.spyOn(InfoHandler, "handler").mockResolvedValue(givenResponse);

    // WHEN the handleRouteEvent is invoked with the given event
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(givenEvent, null, null);

    // THEN expect InfoHandler to have been called with the given event
    expect(givenInfoHandlerSpy).toBeCalledWith(givenEvent, null, null);
    // AND the handleRouteEvent function to return the response from the InfoHandler
    expect(actualResponse).toEqual(givenResponse);
  });

  test("should call presigned handler if path is /presigned", async () => {
    // GIVEN an event with a path that is /presigned & any method
    const givenEvent = {
      path: "/presigned",
    }
    // AND the PresignedHandler will successfully handle the event and return a response
    const givenResponse = response(200, {foo: "bar"});
    const givenPresignedHandlerSpy = jest.spyOn(PresignedHandler, "handler").mockResolvedValue(givenResponse);

    // WHEN the handleRouteEvent is invoked with the given event
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(givenEvent, null, null);

    // THEN expect PresignedHandler to have been called with the given event
    expect(givenPresignedHandlerSpy).toBeCalledWith(givenEvent);
    // AND the handleRouteEvent function to return the response from the PresignedHandler
    expect(actualResponse).toEqual(givenResponse);
  });

  test("should call import handler if path is /import", async () => {
    // GIVEN an event with a path that is /import & any method
    const givenEvent = {
      path: "/import",
    }
    // AND the ImportHandler will successfully handle the event and return a response
    const givenResponse = response(200, {foo: "bar"});
    const givenImportHandlerSpy = jest.spyOn(ImportHandler, "handler").mockResolvedValue(givenResponse);

    // WHEN the handleRouteEvent is invoked and resolves with the given response
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(givenEvent, null, null);

    // THEN expect ImportHandler to have been called with the given event
    expect(givenImportHandlerSpy).toBeCalledWith(givenEvent);
    // AND the handleRouteEvent function to return the response from the ImportHandler
    expect(actualResponse).toEqual(givenResponse);
  });

  test("should call model handler if path is /models", async () => {
    // GIVEN an event with a path that is /models & any method
    const givenEvent = {
      path: "/models",
    }
    // AND the ModelHandler will successfully handle the event and return a response
    const givenResponse = response(200, {foo: "bar"});
    const givenModelHandlerSpy = jest.spyOn(ModelHandler, "handler").mockResolvedValue(givenResponse);

    // WHEN the handleRouteEvent is invoked and resolves with the given response
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(givenEvent, null, null);

    // THEN expect ModelHandler to have been called with the given event
    expect(givenModelHandlerSpy).toBeCalledWith(givenEvent);
    // AND the handleRouteEvent function to return the response from the ModelHandler
    expect(actualResponse).toEqual(givenResponse);
  });

  test.each([null, undefined, "/foo", "foo", "", "/"])("should return NOT_FOUND if path is '%s'", async (path) => {
    // GIVEN a path that is not defined & any method
    const givenEvent = {
      path: path,
    }
    // WHEN the handleRouteEvent is called
    // @ts-ignore
    const actualResponse: APIGatewayProxyResult = await MainHandler.handleRouteEvent(givenEvent, null, null);

    // THEN expect response to be NOT_FOUND
    expect(actualResponse).toBe(STD_ERRORS_RESPONSES.NOT_FOUND);
  });
});