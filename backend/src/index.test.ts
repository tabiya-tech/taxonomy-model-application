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

  describe("test the initialisation", () => {
    test("should call the initialisation", async () => {
      // GIVEN a successfully handled event
      const givenResponse = response(200, {foo: "bar"});
      jest.spyOn(MainHandler, "handleRouteEvent").mockResolvedValue(givenResponse);

      // WHEN the main handler is called
      // @ts-ignore
      await MainHandler.handler(null, null, null);

      // Then expect an initOnce to be called with the environment configuration
      expect(initOnce).toBeCalledTimes(1);
    })

    test("should return INTERNAL_SERVER_ERROR if initialisation fails", async () => {
      // GIVEN the initialization fails
      (initOnce as jest.Mock).mockRejectedValueOnce(new Error("foo"));

      // AND a successfully handled event
      const givenResponse = response(200, {foo: "bar"});
      jest.spyOn(MainHandler, "handleRouteEvent").mockResolvedValue(givenResponse);

      // WHEN the main handler is called
      // @ts-ignore
      const actualResponse = await MainHandler.handler(null, null, null);
      // THEN expect an init called
      expect(initOnce).toBeCalled()
      // AND expect an internal server error response
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR);
    })
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

  test("should call presigned handler if path is /presigned", async () => {
    // GIVEN a path that is /presigned
    // AND any method
    const expectedEvent = {
      path: "/presigned",
    }
    // AND The presigned Handler returns a response
    const expectedResponse = {
      foo: "bar"
    }
    // WHEN the handleRouteEvent is called
    // @ts-ignore
    const presignedHandlerSpy = jest.spyOn(PresignedHandler, "handler").mockImplementation(() => {
        return Promise.resolve(expectedResponse);
      }
    );
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(expectedEvent, null, null);

    // THEN expect models handler to be called with event
    expect(presignedHandlerSpy).toBeCalledWith(expectedEvent);
    // AND the main handler to return the response
    expect(actualResponse).toBeDefined();
  });

  test("should call import handler if path is /import", async () => {
    // GIVEN a path that is /import
    // AND any method
    const expectedEvent = {
      path: "/import",
    }
    // AND The triggerImport Handler returns a response
    const expectedResponse = {}
    // WHEN the handleRouteEvent is called
    // @ts-ignore
    const importHandlerSpy = jest.spyOn(ImportHandler, "handler").mockImplementation(() => {
        return Promise.resolve(expectedResponse);
      }
    );
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(expectedEvent, null, null);

    // THEN expect Presigned handler to be called with event
    expect(importHandlerSpy).toBeCalledWith(expectedEvent);
    // AND the main handler to return the response from the Presigned handler
    expect(actualResponse).toEqual(expectedResponse);
  });

  test("should call Model handler if path is /models", async () => {
    // GIVEN a path that is /Model
    // AND any method
    const expectedEvent = {
      path: "/models",
    }
    // AND The Model Handler returns a response
    const expectedResponse = {}
    // WHEN the handleRouteEvent is called
    // @ts-ignore
    const modelHandlerSpy = jest.spyOn(ModelHandler, "handler").mockImplementation(() => {
        return Promise.resolve(expectedResponse);
      }
    );
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(expectedEvent, null, null);

    // THEN expect Model handler to be called with event
    expect(modelHandlerSpy).toBeCalledWith(expectedEvent);
    // THEN expect Info handler to be called with event
    expect(modelHandlerSpy).toBeCalledWith(expectedEvent);
    // AND the main handler to return the response
    expect(actualResponse).toBeDefined();
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