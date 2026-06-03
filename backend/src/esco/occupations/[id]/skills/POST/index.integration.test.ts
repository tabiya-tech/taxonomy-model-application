import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";
import OccupationAPISpecs from "api-specifications/esco/occupation";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ObjectTypes } from "esco/common/objectTypes";
import { ReuseLevel, SkillType } from "esco/skill/_shared/skill.types";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { usersRequestContext } from "_test_utilities/dataModel";

describe("Test for occupation Skills POST handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload);

  const validateSkillResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.Occupation.Skills.POST.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationSkillsPOSTHandlerTestDB");
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

  beforeEach(async () => {
    if (dbConnection) {
      await dbConnection.models.OccupationModel.deleteMany({});
      await dbConnection.models.SkillModel.deleteMany({});
      await dbConnection.models.OccupationToSkillRelationModel.deleteMany({});
    }
  });

  test("POST should respond with the FORBIDDEN status code if the user is not a model manager", async () => {
    const givenModelId = randomUUID();
    const childId = randomUUID();
    const skillId = randomUUID();
    const payload = {
      requiredSkillId: skillId,
      relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/occupations/${childId}/skills`,
      pathParameters: { modelId: givenModelId, id: childId },
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      requestContext: usersRequestContext.REGISTED_USER,
    };
    const actualResponse = await handler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("POST should respond with CREATED status code and correctly establish relation in DB", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;

    const givenChild = await getRepositoryRegistry().occupation.create({
      modelId: givenModelId,
      code: "1234.1.1",
      preferredLabel: "Child",
      occupationType: ObjectTypes.ESCOOccupation,
      originUri: "http://example.com/child",
      UUIDHistory: [randomUUID()],
      isLocalized: false,
      description: "child description",
      occupationGroupCode: "1234",
      altLabels: [],
      definition: "child definition",
      scopeNote: "child scopeNote",
      regulatedProfessionNote: "child regulatedProfessionNote",
    });

    const givenSkill = await getRepositoryRegistry().skill.create({
      modelId: givenModelId,
      preferredLabel: "Skill",
      UUIDHistory: [randomUUID()],
      isLocalized: false,
      description: "skill description",
      altLabels: [],
      definition: "skill definition",
      scopeNote: "skill scopeNote",
      originUri: "http://example.com/skill",
      reuseLevel: ReuseLevel.CrossSector,
      skillType: SkillType.Knowledge,
    });

    const payload = {
      requiredSkillId: givenSkill.id,
      relationType: OccupationAPISpecs.Enums.OccupationToSkillRelationType.ESSENTIAL,
    };

    const givenEvent = {
      httpMethod: HTTP_VERBS.POST,
      path: `/models/${givenModelId}/occupations/${givenChild.id}/skills`,
      pathParameters: { modelId: givenModelId, id: givenChild.id },
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      requestContext: usersRequestContext.MODEL_MANAGER,
    };

    const actualResponse = await handler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    expect(validateSkillResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    expect(JSON.parse(actualResponse.body).id).toEqual(givenSkill.id);

    // Verify it actually saved to DB
    const cursor = getRepositoryRegistry().occupationToSkillRelation.findAll(givenModelId);
    const results: { requiringOccupationId: string; requiredSkillId: string; relationType: string }[] = [];
    for await (const chunk of cursor) {
      results.push(chunk);
    }
    expect(results).toHaveLength(1);
    expect(results[0].requiringOccupationId.toString()).toEqual(givenChild.id);
    expect(results[0].requiredSkillId.toString()).toEqual(givenSkill.id);
    expect(results[0].relationType).toEqual(OccupationToSkillRelationType.ESSENTIAL);
  });
});
