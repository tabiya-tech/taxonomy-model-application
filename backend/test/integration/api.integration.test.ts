import {
  testSTDRoutesAuthorization,
  generateRequest,
  AllowedMethods,
} from "_test_utilities/testRouteAuthorization";

import { setUpUsersWithRoles } from "_test_utilities/authenticateTestCognitoUser";
import * as supertest from "supertest";

import AuthAPISpecs from "api-specifications/auth";
import { StatusCodes } from "server/httpUtils";
import process from "process";

/**
 * The purpose of this test suite is to test the existing backend routes and their responses.
 * We have these exposed backend routes:
 * - /info (GET)
 * - /models (GET, POST)
 * - /import (POST)
 * - /export (POST)
 * - /presigned (GET)
 */
const baseUrl: string = process.env.BACKEND_URL as string;
// const baseUrl: string = "https://dev.tabiya.tech/taxonomy/api";
// First setup the request agent
const request = supertest.agent(baseUrl);

const openRoutes: [string, AllowedMethods][] = [
  ["/info", "GET"],
  ["/models", "GET"],
];

const modelManagerAccessibleRoutes: [string, AllowedMethods][] = [
  ["/import", "POST"],
  //TODO enable these tests when the routes are secured
  // ['/models', 'POST'],
  // ['/export', 'POST'],
];

describe("Test route", () => {
  let userTokens: { "model-managers": string; "registered-users": string; anonymous: string };
  beforeAll(async () => {
    userTokens = await setUpUsersWithRoles();
  });

  describe("Test open routes", () => {
    describe.each([...openRoutes])(`Test %s %s`, (route, method) => {
      test(`should allow anonymous access to ${method} ${route}`, async () => {
        // GIVEN a request to the open route with an anonymous token
        const response = await generateRequest(request, route, method, `Bearer ${userTokens.anonymous}`).timeout(5000);
        // THEN the response status code should be 200
        expect(response.statusCode).toBe(StatusCodes.OK);
      });

      test(`should allow registered users access to ${method} ${route}`, async () => {
        // GIVEN a request to the open route with a registered user token
        const response = await generateRequest(
          request,
          route,
          method,
          `Bearer ${userTokens[AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER]}`
        ).timeout(5000);
        expect(response.statusCode).toBe(StatusCodes.OK);
      });

      test(`should allow model managers access to ${method} ${route}`, async () => {
        // GIVEN a request to the open route with a model manager token
        const response = await generateRequest(
          request,
          route,
          method,
          `Bearer ${userTokens[AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER]}`
        ).timeout(5000);
        expect(response.statusCode).toBe(StatusCodes.OK);
      });

      testSTDRoutesAuthorization(route, method, [AuthAPISpecs.Enums.TabiyaRoles.ANONYMOUS], request);
    });
  });

  describe("Test routes secured for model managers", () => {
    describe.each([...modelManagerAccessibleRoutes])(`Test %s %s`, (route, method) => {
      test(`should deny anonymous access to ${method} ${route}`, async () => {
        // GIVEN a request to the secured route with an anonymous token
        const response = await generateRequest(request, route, method, `Bearer ${userTokens.anonymous}`).timeout(5000);
        // THEN the response status code should be 401
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
      });

      test(`should deny registered users access to ${method} ${route}`, async () => {
        // GIVEN a request to the secured route with a registered user token
        const response = await generateRequest(
          request,
          route,
          method,
          `Bearer ${userTokens[AuthAPISpecs.Enums.TabiyaRoles.REGISTERED_USER]}`
        ).timeout(5000);
        // THEN the response status code should be 403
        expect(response.statusCode).toBe(StatusCodes.FORBIDDEN);
      });

      test(`should allow model managers access to ${method} ${route}`, async () => {
        // GIVEN a request to the secured route with a model manager token
        const response = await generateRequest(
          request,
          route,
          method,
          `Bearer ${userTokens[AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER]}`
        ).timeout(5000);
        // THEN the response status code should not be 401, 403, or 404 (but we don't know the expected status code since it depends on the execution of the route)
        expect(response.statusCode).not.toBeOneOf([
          StatusCodes.UNAUTHORIZED,
          StatusCodes.FORBIDDEN,
          StatusCodes.NOT_FOUND,
        ]);
      });

      testSTDRoutesAuthorization("/import", "POST", [AuthAPISpecs.Enums.TabiyaRoles.MODEL_MANAGER], request);
    });
  });
});
