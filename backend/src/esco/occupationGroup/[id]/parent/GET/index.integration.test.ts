import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { StatusCodes } from "server/httpUtils";
import { handler as occupationGroupParentHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ObjectTypes } from "esco/common/objectTypes";
import { getSimpleNewISCOGroupSpec, getSimpleNewISCOGroupSpecWithParentCode } from "esco/_test_utilities/getNewSpecs";

describe("Test for occupationGroup parent GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Schemas.Response.Payload);
  const validateResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.OccupationGroup.Parent.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupParentHandlerTestDB");
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

  test("GET /occupationGroups/{id}/parent should return the parent occupation group", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const repository = getRepositoryRegistry().OccupationGroup;
    const givenParent = await repository.create({
      ...getSimpleNewISCOGroupSpec(givenModelId, "parent"),
      originUri: "https://example.com/occupation-groups/parent",
      description: "Parent occupation group",
    });
    const givenChild = await repository.create({
      ...getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "child", givenParent.code),
      originUri: "https://example.com/occupation-groups/child",
      description: "Child occupation group",
    });

    await getRepositoryRegistry().occupationHierarchy.createMany(givenModelId, [
      {
        parentId: givenParent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: givenChild.id,
        childType: ObjectTypes.ISCOGroup,
      },
    ]);

    const givenEvent = {
      httpMethod: "GET",
      path: `/models/${givenModelId}/occupationGroups/${givenChild.id}/parent`,
      pathParameters: { modelId: givenModelId, id: givenChild.id },
    };

    const actualResponse = await occupationGroupParentHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateResponse(actualBody)).toBeTruthy();
    expect(actualBody.id).toEqual(givenParent.id);
    expect(actualBody.children[0].id).toEqual(givenChild.id);
  });
});
