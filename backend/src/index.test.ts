// mute console.log during test
import "_test_utilities/consoleMock";

// ##############
// Setup the configuration mock
const mockConfiguration = {
  dbURI: "mongodb://username@password:server:port/database",
  resourcesBaseUrl: "https://path/to/resource",
};
jest.mock("./server/config/config", () => {
  const originalModule = jest.requireActual("./server/config/config");
  return {
    ...originalModule,
    readEnvironmentConfiguration: jest.fn().mockImplementation(() => {
      return mockConfiguration;
    }),
  };
});

// Setup the init mock
jest.mock("./server/init", () => {
  const originalModule = jest.requireActual("./server/init");
  return {
    ...originalModule,
    initOnce: jest.fn().mockImplementation(() => {
      return Promise.resolve();
    }),
  };
});
// ##############

import * as MainHandler from "./index";
import * as InfoHandler from "./applicationInfo";
import * as ModelHandler from "./modelInfo/index";
import * as PresignedHandler from "./presigned/index";
import * as ImportHandler from "./import/index";
import * as ExportHandler from "./export/index";
import { APIGatewayProxyEventBase, APIGatewayProxyResult } from "aws-lambda/trigger/api-gateway-proxy";
import { response, STD_ERRORS_RESPONSES } from "./server/httpUtils";
import { initOnce } from "./server/init";
import { APIGatewayEventDefaultAuthorizerContext } from "aws-lambda";

beforeEach(() => {
  jest.clearAllMocks();
});

describe("test the main handler function", () => {
  afterAll(() => {
    (MainHandler.handleRouteEvent as jest.Mock).mockRestore();
  });
  test("should return the response from the handleRouteEvent function", async () => {
    // GIVEN some event
    const givenEvent = {
      event: "",
    } as unknown as APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>;
    // AND the handleRouteEvent will successfully handle the event and return a response
    const givenResponse = response(200, { foo: "bar" });
    const givenHandleRouteEventSpy = jest.spyOn(MainHandler, "handleRouteEvent").mockResolvedValue(givenResponse);

    // WHEN the main handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await MainHandler.handler(givenEvent);

    // THEN expect the handleRouteEvent function to be called with the given event, context and callback
    expect(givenHandleRouteEventSpy).toBeCalledWith(givenEvent);
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
      const givenResponse = response(200, { foo: "bar" });
      jest.spyOn(MainHandler, "handleRouteEvent").mockResolvedValue(givenResponse);

      // WHEN the main handler is invoked
      // @ts-ignore
      await MainHandler.handler(null, null, null);

      // THEN expect initOnce to have been called
      expect(initOnce).toBeCalledTimes(1);
    });

    test("should return INTERNAL_SERVER_ERROR if initialisation fails", async () => {
      // GIVEN that initOnce will fail
      (initOnce as jest.Mock).mockRejectedValueOnce(new Error("foo"));
      // AND the handleRouteEvent will successfully handle the event and return a response
      const givenResponse = response(200, { foo: "bar" });
      jest.spyOn(MainHandler, "handleRouteEvent").mockResolvedValue(givenResponse);

      // WHEN the main handler is invoked
      // @ts-ignore
      const actualResponse = await MainHandler.handler(null, null, null);

      // THEN expect initOnce to have been called
      expect(initOnce).toBeCalled();
      // AND an internal server error response
      expect(actualResponse).toEqual(STD_ERRORS_RESPONSES.INTERNAL_SERVER_ERROR);
    });
  });
});

describe("test the handleRouteEvent function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test.each([
    ["/info", InfoHandler],
    ["/presigned", PresignedHandler],
    ["/import", ImportHandler],
    ["/models", ModelHandler],
    ["/export", ExportHandler],
  ])(`should call %s handler if path is %s`, async (givenPath, handler) => {
    // GIVEN an event with the given path & any HTTP method
    const givenEvent = {
      path: givenPath,
    } as unknown as APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>;
    // AND the Handler will successfully handle the event and return a response
    const givenResponse = response(200, { foo: "bar" });
    const givenHandlerSpy = jest.spyOn(handler, "handler").mockResolvedValue(givenResponse);

    // WHEN the handleRouteEvent is invoked and resolves with the given response
    // @ts-ignore
    const actualResponse = await MainHandler.handleRouteEvent(givenEvent);

    // THEN expect Handler to have been called with the given event
    expect(givenHandlerSpy).toBeCalledWith(givenEvent);
    // AND the handleRouteEvent function to return the response from the Handler
    expect(actualResponse).toEqual(givenResponse);
  });

  test.each([null, undefined, "/foo", "foo", "", "/"])("should return NOT_FOUND if path is '%s'", async (path) => {
    // GIVEN a path that is not defined & any method
    const givenEvent = {
      path: path,
    } as unknown as APIGatewayProxyEventBase<APIGatewayEventDefaultAuthorizerContext>;
    // WHEN the handleRouteEvent is called
    // @ts-ignore
    const actualResponse: APIGatewayProxyResult = await MainHandler.handleRouteEvent(givenEvent);

    // THEN expect response to be NOT_FOUND
    expect(actualResponse).toBe(STD_ERRORS_RESPONSES.NOT_FOUND);
  });
});
