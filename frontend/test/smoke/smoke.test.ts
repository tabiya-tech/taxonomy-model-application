import {SuperAgentTest} from 'supertest';
import * as supertest from "supertest";
import {StatusCodes} from "http-status-codes";

describe("Testing the deployment of the frontend", () => {
  const baseUrl: string = process.env.E2E_BASE_URL as string;
  beforeAll(() => {
    expect(baseUrl).toBeDefined();
    request = supertest.agent(baseUrl);
  });

  let request: SuperAgentTest;
  test("GET /data/version should respond with the correct version", async () => {
    const expectedVersion = JSON.parse(process.env.EXPECTED_VERSION_INFO as string);
    expect(expectedVersion).toBeDefined();
    const response = await request.get('/data/version.json').timeout(5000);
    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body).toMatchObject(expectedVersion);
  });
});