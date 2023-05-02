import {SuperAgentTest} from 'supertest';
import * as supertest from "supertest";
import {StatusCodes} from "httpUtils";

describe("Testing the deployment of the api", () => {
  const baseUrl: string = process.env.E2E_BASE_URL as string;
  beforeAll(() => {
    request = supertest.agent(baseUrl);
  });

  let request: SuperAgentTest;
  test("GET /info should respond with the correct version", async () => {
    const expectedVersion = JSON.parse(process.env.EXPECTED_VERSION_INFO as string);
    expect(expectedVersion).toBeDefined();
    const response = await request.get('/info').timeout(5000);
    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body).toMatchObject(expectedVersion);
  });
});