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
import { ISkill } from "./skills.types";
import { getMockStringId } from "_test_utilities/mockMongoId";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";
import { ObjectTypes, SignallingValueLabel } from "esco/common/objectTypes";
import { MongooseModelName } from "esco/common/mongooseModelNames";
import { OccupationToSkillRelationType } from "esco/occupationToSkillRelation/occupationToSkillRelation.types";
import { SkillToSkillRelationType } from "esco/skillToSkillRelation/skillToSkillRelation.types";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import OccupationAPISpecs from "api-specifications/esco/occupation";

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
    importId: randomUUID(),
  });
}

async function createSkillsInDB(count: number, modelId: string = getMockStringId(1)): Promise<ISkill[]> {
  const skills: ISkill[] = [];
  for (let i = 0; i < count; i++) {
    skills.push(await createSkillInDB(modelId));
  }
  return skills;
}

async function createSkillGroupInDB(modelId: string = getMockStringId(1)) {
  return await getRepositoryRegistry().skillGroup.create({
    modelId: modelId,
    preferredLabel: getRandomString(SkillGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(SkillGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(SkillGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    scopeNote: getRandomString(SkillGroupAPISpecs.Constants.MAX_SCOPE_NOTE_LENGTH),
    code: "S" + Math.floor(Math.random() * 100),
  });
}

async function createOccupationInDB(modelId: string = getMockStringId(1)) {
  return await getRepositoryRegistry().occupation.create({
    modelId: modelId,
    preferredLabel: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
    description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
    altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
    originUri: `http://some/path/to/api/resources/${randomUUID()}`,
    UUIDHistory: [randomUUID()],
    code: "1234." + Math.floor(Math.random() * 100),
    occupationGroupCode: "1234",
    occupationType: ObjectTypes.ESCOOccupation,
    isLocalized: true,
    definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
    scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
    regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
  });
}

describe("Test for skill handler with a DB", () => {
  // setup the ajv validate GET, POST, etc response functions
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(SkillAPISpecs.Schemas.GET.Response.Payload).addSchema(SkillAPISpecs.Schemas.POST.Response.Payload);

  const validateGETResponse: ValidateFunction = ajv.getSchema(
    SkillAPISpecs.Schemas.GET.Response.Payload.$id as string
  ) as ValidateFunction;

  // Note: Skill API does not have a separate ById response schema, it uses the base response schema for items
  // But we might want to validate the single item response separately if needed, passing expected object structure

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillHandlerTestDB");
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
      // delete all documents in the DB
      await dbConnection.models.SkillModel.deleteMany({});
      await dbConnection.models.SkillGroupModel.deleteMany({});
      await dbConnection.models.OccupationModel.deleteMany({});
      await dbConnection.models[MongooseModelName.SkillHierarchy].deleteMany({});
      await dbConnection.models[MongooseModelName.OccupationToSkillRelation].deleteMany({});
      await dbConnection.models[MongooseModelName.SkillToSkillRelation].deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });
  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN several skill objects are in the DB
    const givenModelInfo = await createModelInDB();

    const skills = await createSkillsInDB(3, givenModelInfo.id.toString());
    expect(skills.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 2;
    const cursor = Buffer.from(JSON.stringify({ id: skills[2].id, createdAt: skills[2].createdAt })).toString("base64");

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: {
        limit: limit.toString(),
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await skillHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND an skill object that validates against the SkillResponseGET schema
    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  test("GET should respond with a single skill when asked for one", async () => {
    // GIVEN several skill objects are in the DB
    const givenModelInfo = await createModelInDB();

    const skills = await createSkillsInDB(3, givenModelInfo.id.toString());
    expect(skills.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString(), id: skills[1].id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skills/${skills[1].id.toString()}`,
    };
    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await skillHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND the response body should match the skill we asked for
    const responseBody = JSON.parse(actualResponse.body);
    expect(responseBody.id).toEqual(skills[1].id);
    expect(responseBody.UUID).toEqual(skills[1].UUID);
  });

  test("GET should return at most the passed limit skills", async () => {
    // GIVEN several Skill objects are in the DB
    const givenModelInfo = await createModelInDB();
    const skills = await createSkillsInDB(10, givenModelInfo.id.toString());
    expect(skills.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 5;
    const cursor = Buffer.from(JSON.stringify({ id: skills[8].id, createdAt: skills[8].createdAt })).toString("base64");

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: {
        limit: limit,
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await skillHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const actualBody = JSON.parse(actualResponse.body);
    const actualSkills = actualBody.data as ISkill[];

    // AND the response skills should have at most of the limit count of Skills
    expect(actualSkills.length).toBeLessThanOrEqual(limit);

    // AND the response skills should be the expected ones
    // The cursor points to skills[8], so with descending order we expect the 5 items older than that
    // which are skills[7, 6, 5, 4, 3] in descending order (newest to oldest of those)
    expect(actualSkills.map((m) => m.UUID)).toMatchObject(
      skills
        .slice(3, 8)
        .reverse()
        .map((m) => m.UUID)
    );
  });

  test("GET should paginate correctly across random page sizes", async () => {
    // GIVEN twenty skills in the DB
    const givenModelInfo = await createModelInDB();
    await createSkillsInDB(20, givenModelInfo.id.toString());

    // Baseline: first 20 to know expected order
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: { limit: "20" },
    };
    // @ts-ignore
    const baselineResponse = await skillHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as ISkill[]).map((m) => m.id.toString());
    expect(baselineIds).toHaveLength(20);

    // Generate random page sizes in [1,20] to test pagination with different limits
    const pageSizes: number[] = [];
    let planned = 0;
    while (planned < baselineIds.length) {
      const size = 1 + Math.floor(Math.random() * 20); // 1..20
      pageSizes.push(size);
      planned += size;
    }

    let cursor: string | undefined = undefined;
    const collected: string[] = [];

    // WHEN paging through with the random page sizes
    for (const size of pageSizes) {
      const event = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId: givenModelInfo.id.toString() },
        queryStringParameters: { limit: size.toString(), ...(cursor ? { cursor } : {}) },
      };
      // @ts-ignore
      const resp = await skillHandler(event);
      expect(resp.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(resp.body);
      const ids = (body.data as ISkill[]).map((m) => m.id.toString());
      collected.push(...ids);
      cursor = body.nextCursor || undefined;
      if (!cursor) break; // no more pages
    }

    // THEN the collected IDs equal the baseline IDs
    expect(collected.slice(0, baselineIds.length)).toEqual(baselineIds);
  });

  describe("Integration tests for Skill relations", () => {
    test("GET /models/{modelId}/skills/{id}/parents should return parents", async () => {
      // GIVEN a model
      const givenModel = await createModelInDB();
      const modelId = givenModel.id.toString();
      // AND a subject skill
      const givenSubject = await createSkillInDB(modelId);
      // AND a parent skill
      const givenParentSkill = await createSkillInDB(modelId);
      // AND a parent skill group
      const givenParentGroup = await createSkillGroupInDB(modelId);

      // AND they are related
      await getRepositoryRegistry().skillHierarchy.createMany(modelId, [
        {
          parentType: ObjectTypes.Skill,
          parentId: givenParentSkill.id,
          childType: ObjectTypes.Skill,
          childId: givenSubject.id,
        },
        {
          parentType: ObjectTypes.SkillGroup,
          parentId: givenParentGroup.id,
          childType: ObjectTypes.Skill,
          childId: givenSubject.id,
        },
      ]);

      // WHEN requesting parents
      const event = {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${modelId}/skills/${givenSubject.id}/parents`,
      };
      // @ts-ignore
      const response = await skillHandler(event);

      // THEN expect OK
      expect(response.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(2);
      expect(body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: givenParentSkill.id }),
          expect.objectContaining({ id: givenParentGroup.id }),
        ])
      );
    });

    test("GET /models/{modelId}/skills/{id}/children should return children", async () => {
      // GIVEN a model
      const givenModel = await createModelInDB();
      const modelId = givenModel.id.toString();
      // AND a subject skill
      const givenSubject = await createSkillInDB(modelId);
      // AND a child skill
      const givenChildSkill = await createSkillInDB(modelId);

      // AND they are related
      await getRepositoryRegistry().skillHierarchy.createMany(modelId, [
        {
          parentType: ObjectTypes.Skill,
          parentId: givenSubject.id,
          childType: ObjectTypes.Skill,
          childId: givenChildSkill.id,
        },
      ]);

      // WHEN requesting children
      const event = {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${modelId}/skills/${givenSubject.id}/children`,
      };
      // @ts-ignore
      const response = await skillHandler(event);

      // THEN expect OK
      expect(response.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toEqual(givenChildSkill.id);
    });

    test("GET /models/{modelId}/skills/{id}/occupations should return related occupations", async () => {
      // GIVEN a model
      const givenModel = await createModelInDB();
      const modelId = givenModel.id.toString();
      // AND a subject skill
      const givenSubject = await createSkillInDB(modelId);
      // AND a requiring occupation
      const givenOccupation = await createOccupationInDB(modelId);

      // AND they are related
      const createdRelations = await getRepositoryRegistry().occupationToSkillRelation.createMany(modelId, [
        {
          requiringOccupationId: givenOccupation.id,
          requiringOccupationType: ObjectTypes.ESCOOccupation,
          requiredSkillId: givenSubject.id,
          relationType: OccupationToSkillRelationType.ESSENTIAL,
          signallingValue: null,
          signallingValueLabel: SignallingValueLabel.NONE,
        },
      ]);
      expect(createdRelations).toHaveLength(1);

      // WHEN requesting occupations
      const event = {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${modelId}/skills/${givenSubject.id}/occupations`,
      };
      // @ts-ignore
      const response = await skillHandler(event);

      // THEN expect OK
      expect(response.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toEqual(givenOccupation.id);
      expect(body.data[0].relationType).toEqual("essential");
    });

    test("GET /models/{modelId}/skills/{id}/related should return related skills", async () => {
      // GIVEN a model
      const givenModel = await createModelInDB();
      const modelId = givenModel.id.toString();
      // AND a subject skill
      const givenSubject = await createSkillInDB(modelId);
      // AND a related skill
      const givenRelatedSkill = await createSkillInDB(modelId);

      // AND they are related
      await getRepositoryRegistry().skillToSkillRelation.createMany(modelId, [
        {
          requiringSkillId: givenSubject.id,
          requiredSkillId: givenRelatedSkill.id,
          relationType: SkillToSkillRelationType.ESSENTIAL,
        },
      ]);

      // WHEN requesting related skills
      const event = {
        httpMethod: HTTP_VERBS.GET,
        path: `/models/${modelId}/skills/${givenSubject.id}/related`,
      };
      // @ts-ignore
      const response = await skillHandler(event);

      // THEN expect OK
      expect(response.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(response.body);
      expect(body.data).toHaveLength(1);
      expect(body.data[0].id).toEqual(givenRelatedSkill.id);
    });
  });
});
