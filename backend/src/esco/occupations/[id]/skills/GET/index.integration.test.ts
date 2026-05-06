import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import { StatusCodes } from "server/httpUtils";
import { handler as occupationHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";

import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SkillType, ReuseLevel } from "esco/skill/skills.types";

describe("Test for occupation Skills GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationAPISpecs.Occupation.Skills.GET.Schemas.Response.Payload);
  const validateSkillsResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.Occupation.Skills.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationSkillsHandlerTestDB");
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

  test("GET /occupations/{id}/skills should return the skills of the occupation", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const repository = getRepositoryRegistry().occupation;
    const givenOccupation = await repository.create({
      modelId: givenModelId,
      code: "1234.1",
      preferredLabel: "Occupation",
      occupationType: ObjectTypes.ESCOOccupation,
      originUri: "http://example.com/occupation1",
      UUIDHistory: [randomUUID()],
      isLocalized: false,
      description: "description",
      occupationGroupCode: "1234",
      altLabels: [],
      definition: "definition",
      scopeNote: "scopeNote",
      regulatedProfessionNote: "regulatedProfessionNote",
    });
    const givenSkill = await getRepositoryRegistry().skill.create({
      modelId: givenModelId,
      importId: "skill1",
      preferredLabel: "Skill",
      originUri: "http://example.com/skill1",
      UUIDHistory: [randomUUID()],
      isLocalized: false,
      description: "description",
      altLabels: [],
      definition: "definition",
      scopeNote: "scopeNote",
      skillType: SkillType.Knowledge,
      reuseLevel: ReuseLevel.CrossSector,
    });

    await getRepositoryRegistry().occupationToSkillRelation.createMany(givenModelId, [
      {
        requiringOccupationType: ObjectTypes.ESCOOccupation,
        requiringOccupationId: givenOccupation.id as string,
        requiredSkillId: givenSkill.id as string,
        relationType: OccupationToSkillRelationType.ESSENTIAL,
        signallingValueLabel: SignallingValueLabel.NONE,
        signallingValue: null,
      },
    ]);

    const givenEvent = {
      httpMethod: "GET",
      path: `/models/${givenModelId}/occupations/${givenOccupation.id}/skills`,
      pathParameters: { modelId: givenModelId, id: givenOccupation.id },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(validateSkillsResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    expect(JSON.parse(actualResponse.body).data[0].id).toEqual(givenSkill.id);
  });
});
