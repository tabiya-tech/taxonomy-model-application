import * as supertest from "supertest";
import { SuperAgentTest } from "supertest";
import { StatusCodes } from "server/httpUtils";

// Output the environment variables for debugging purposes
console.log(`E2E_RESOURCES_BASE_URL: ${process.env.E2E_RESOURCES_BASE_URL}`);
console.log(`E2E_BASE_URL: ${process.env.E2E_BASE_URL}`);
console.log(`EXPECTED_VERSION_INFO: ${process.env.EXPECTED_VERSION_INFO}`);

const baseUrl: string = process.env.E2E_BASE_URL as string;
const resourcesBaseUrl: string = process.env.E2E_RESOURCES_BASE_URL as string;
let expectedVersion: object = {};

try {
  expectedVersion = JSON.parse(process.env.EXPECTED_VERSION_INFO as string);
} catch (error) {
  const err = Error("Error parsing EXPECTED_VERSION_INFO:", { cause: error });
  console.error(err);
  throw err;
}

/*
 * Smoke test may fail, especially if the backend lambda function cold starts.
 * Retry the test up to 3 times if it fails.
 */

jest.retryTimes(3, { logErrorsBeforeRetry: true });

describe("Testing the deployment of the api", () => {
  beforeAll(() => {
    request = supertest.agent(baseUrl);
  });

  let request: SuperAgentTest;
  test("GET /info should respond with the correct version for an anonymous request", async () => {
    // GIVEN the expected version information
    expect(expectedVersion).toBeDefined();
    // AND an authorization token with the value ANONYMOUS
    const givenToken = "Bearer ANONYMOUS";
    // WHEN a GET request is made to /info
    //  since the jest default timeout is set to 5 secs, wait for the response for 4 secs
    const response = await request.get("/info").set("Authorization", givenToken).timeout(4000);

    // THEN the response should be successful and contain the expected version information
    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body).toMatchObject({
      ...expectedVersion,
      path: `${resourcesBaseUrl}/info`,
      database: "connected",
    });
  });
});
