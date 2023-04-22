import {SuperAgentTest} from 'supertest';
import * as supertest from "supertest";
import version from "info/version.json";
import {StatusCodes} from "httpUtils";

describe("Testing the deployment of the api", () => {
  const baseUrl: string = "https://j17b26oc5i.execute-api.eu-central-1.amazonaws.com/dev";
  beforeAll(() => {
    request = supertest.agent(baseUrl);
  });

  let request: SuperAgentTest;
  test("GET /info should respond with the correct version", async () => {
    const response = await request.get('/info').timeout(5000);
    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.body).toMatchObject(version);
  });
});