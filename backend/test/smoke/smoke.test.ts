import {SuperAgentTest} from 'supertest';
import * as supertest from "supertest";
import {StatusCodes} from "server/httpUtils";

//  Output the environment variables for debugging purposes
console.log(`E2E_RESOURCES_BASE_URL: ${process.env.E2E_RESOURCES_BASE_URL}`);
console.log(`E2E_BASE_URL: ${process.env.E2E_BASE_URL}`);
console.log(`EXPECTED_VERSION_INFO: ${process.env.EXPECTED_VERSION_INFO}`);

describe("Testing the deployment of the api", () => {
  const baseUrl: string = process.env.E2E_BASE_URL as string;
  const resourcesBaseUrl: string = process.env.E2E_RESOURCES_BASE_URL as string;

  beforeAll(() => {
    request = supertest.agent(baseUrl);
  });

  let request: SuperAgentTest;
  test("GET /info should respond with the correct version", async () => {
    const expectedVersion = JSON.parse(process.env.EXPECTED_VERSION_INFO as string);
    expect(expectedVersion).toBeDefined();
    const response = await request.get('/info').timeout(5000);
    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body).toMatchObject({
      ...expectedVersion,
      path: `${resourcesBaseUrl}/info`,
      database: "connected"
    });
  });
});