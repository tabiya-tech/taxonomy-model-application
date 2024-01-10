// mute the console output
import "_test_utilities/consoleMock";

import { handler as infoHandler } from "applicationInfo/index";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import version from "applicationInfo/version.json";
import * as config from "server/config/config";
import { testMethodsNotAllowed } from "_test_utilities/stdRESTHandlerTests";
import { Connection } from "mongoose";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { Routes } from "routes.constant";

describe("Test for info handler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("DB Not connected", () => {
    it("GET should respond with the OK, the version and DB not connected, ", async () => {
      // GIVEN some configuration
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);
      // AND GET event
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        path: Routes.APPLICATION_INFO_ROUTE,
      };
      // WHEN the info handler is invoked with event param
      // @ts-ignore
      const actualResponse = await infoHandler(givenEvent, null, null);

      // THEN expect response to be OK and the version
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND expect the body to be a json representation the version
      expect(JSON.parse(actualResponse.body)).toEqual({
        ...version,
        path: `${givenResourcesBaseUrl}${givenEvent.path}`,
        database: "not connected",
      });
    });
  });

  describe("DB connected", () => {
    let dbConnection: Connection | undefined;
    beforeAll(async () => {
      // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
      const config = getTestConfiguration("ApplicationInfoHandlerTestDB");
      const configModule = await import("server/config/config");
      jest.spyOn(configModule, "readEnvironmentConfiguration").mockReturnValue(config);
      await initOnce();
      dbConnection = getConnectionManager().getCurrentDBConnection();
    });

    afterAll(async () => {
      if (dbConnection) {
        await dbConnection.dropDatabase();
        await dbConnection.close();
      }
    });

    it("GET should respond with the OK, the version and DB connected, ", async () => {
      // GIVEN some configuration
      const givenResourcesBaseUrl = "https://some/path/to/api/resources";
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);
      // AND GET event
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        path: Routes.APPLICATION_INFO_ROUTE,
      };
      // AND the DB is connected

      // WHEN the info handler is invoked with event param
      // @ts-ignore
      const actualResponse = await infoHandler(givenEvent, null, null);

      // THEN expect response to be OK and the version
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      // AND expect the body to be a json representation the version
      expect(JSON.parse(actualResponse.body)).toEqual({
        ...version,
        path: `${givenResourcesBaseUrl}${givenEvent.path}`,
        database: "connected",
      });
    });
  });

  testMethodsNotAllowed(
    [HTTP_VERBS.PUT, HTTP_VERBS.DELETE, HTTP_VERBS.OPTIONS, HTTP_VERBS.PATCH, HTTP_VERBS.POST],
    infoHandler
  );
});
