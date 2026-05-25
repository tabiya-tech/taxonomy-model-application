import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import SkillAPISpecs from "api-specifications/esco/skill";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ISkill } from "../_shared/skill.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";

async function createModelInDB() {
  return await getRepositoryRegistry().modelInfo.create({
    name: getTestString(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH),
    locale: {
      UUID: randomUUID(),
      name: getTestString(LocaleAPISpecs.Constants.NAME_MAX_LENGTH),
      shortCode: getTestString(LocaleAPISpecs.Constants.LOCALE_SHORTCODE_MAX_LENGTH),
    },
    description: getTestString(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    license: getTestString(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH),
    UUIDHistory: [randomUUID()],
  });
}

async function createSkillInDB(modelId: string = getMockStringId(1)): Promise<ISkill> {
  return await getRepositoryRegistry().skill.create({
    modelId: modelId,
    preferredLabel: getRandomString(SkillAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(SkillAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: getRandomString(SkillAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    definition: getRandomString(SkillAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
    reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
    isLocalized: true,
  });
}

async function createSkillsInDB(count: number, modelId: string = getMockStringId(1)): Promise<ISkill[]> {
  const skills: ISkill[] = [];
  for (let i = 0; i < count; i++) {
    skills.push(await createSkillInDB(modelId));
  }
  return skills;
}

describe("Test for skill GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(SkillAPISpecs.GET.Schemas.Response.Payload);

  const validateGETResponse: ValidateFunction = ajv.getSchema(
    SkillAPISpecs.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("SkillGETHandlerTestDB");
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
      await dbConnection.models.SkillModel.deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });
  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    const givenModelInfo = await createModelInDB();

    const skills = await createSkillsInDB(3, givenModelInfo.id.toString());
    expect(skills.length).toBeGreaterThan(0);
    const limit = 2;
    const cursor = Buffer.from(JSON.stringify({ id: skills[2].id, createdAt: skills[2].createdAt })).toString("base64");

    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skills`,
      queryStringParameters: {
        limit: limit.toString(),
        cursor: cursor,
      },
    };

    // @ts-ignore
    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  test("GET should return at most the passed limit skills", async () => {
    const givenModelInfo = await createModelInDB();
    const skills = await createSkillsInDB(10, givenModelInfo.id.toString());
    expect(skills.length).toBeGreaterThan(0);
    const limit = 5;
    const cursor = Buffer.from(JSON.stringify({ id: skills[8].id, createdAt: skills[8].createdAt })).toString("base64");

    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skills`,
      queryStringParameters: {
        limit: limit,
        cursor: cursor,
      },
    };

    // @ts-ignore
    const actualResponse = await skillHandler(givenEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const actualBody = JSON.parse(actualResponse.body);
    const actualSkills = actualBody.data as ISkill[];

    expect(actualSkills.length).toBeLessThanOrEqual(limit);

    expect(actualSkills.map((m) => m.UUID)).toMatchObject(
      skills
        .slice(3, 8)
        .reverse()
        .map((m) => m.UUID)
    );
  });

  test("GET should paginate correctly across random page sizes", async () => {
    const givenModelInfo = await createModelInDB();
    await createSkillsInDB(20, givenModelInfo.id.toString());

    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skills`,
      queryStringParameters: { limit: "20" },
    };
    // @ts-ignore
    const baselineResponse = await skillHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as ISkill[]).map((m) => m.id.toString());
    expect(baselineIds).toHaveLength(20);

    const pageSizes: number[] = [];
    let planned = 0;
    while (planned < baselineIds.length) {
      const size = 1 + Math.floor(Math.random() * 20);
      pageSizes.push(size);
      planned += size;
    }

    let cursor: string | undefined = undefined;
    const collected: string[] = [];

    for (const size of pageSizes) {
      const event = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId: givenModelInfo.id.toString() },
        path: `/models/${givenModelInfo.id.toString()}/skills`,
        queryStringParameters: { limit: size.toString(), ...(cursor ? { cursor } : {}) },
      };
      // @ts-ignore
      const resp = await skillHandler(event);
      expect(resp.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(resp.body);
      const ids = (body.data as ISkill[]).map((m) => m.id.toString());
      collected.push(...ids);
      cursor = body.nextCursor || undefined;
      if (!cursor) break;
    }

    expect(collected.slice(0, baselineIds.length)).toEqual(baselineIds);
  });
});
