import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupDetailGETAPISpecs from "api-specifications/esco/occupationGroup/[id]/GET";

import { StatusCodes } from "server/httpUtils";
import { handler as occupationGroupDetailHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { getSimpleNewISCOGroupSpec } from "esco/_test_utilities/getNewSpecs";

describe("Test for occupationGroup detail GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupDetailGETAPISpecs.Schemas.Response.Payload);
  const validateResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupDetailGETAPISpecs.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupDetailHandlerTestDB");
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

  test("GET /occupationGroups/{id} should return the occupation group", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenOccupationGroup = await getRepositoryRegistry().OccupationGroup.create({
      ...getSimpleNewISCOGroupSpec(givenModel.id, "occupation-group"),
      originUri: "https://example.com/occupation-groups/detail",
      description: "Occupation group detail",
    });

    const givenEvent = {
      httpMethod: "GET",
      path: `/models/${givenModel.id}/occupationGroups/${givenOccupationGroup.id}`,
      pathParameters: { modelId: givenModel.id, id: givenOccupationGroup.id },
    };

    const actualResponse = await occupationGroupDetailHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateResponse(actualBody)).toBeTruthy();
    expect(actualBody.id).toEqual(givenOccupationGroup.id);
    expect(actualBody.path).toContain(`/models/${givenModel.id}/occupationGroups/${givenOccupationGroup.id}`);
  });
});
