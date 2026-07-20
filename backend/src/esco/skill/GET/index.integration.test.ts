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
import { getEmbeddingModelService } from "embeddings/models/embeddingModelServiceFactory";
import { EmbeddableField } from "embeddings/service/types";

// The embedding module is mocked for the vector-search tests below: the in-memory MongoDB used by the integration
// tests cannot run an Atlas $vectorSearch, and no real embedding provider is available. Mocking the factory lets the
// released-model search path be exercised against a real DB with a faked query embedding and stubbed ranked hits.
jest.mock("embeddings/models/embeddingModelServiceFactory", () => ({
  getEmbeddingModelService: jest.fn(),
}));

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

  async function createSkillWithLabel(modelId: string, preferredLabel: string): Promise<ISkill> {
    return await getRepositoryRegistry().skill.create({
      modelId: modelId,
      preferredLabel: preferredLabel,
      description: "",
      altLabels: [],
      originUri: `http://some/path/to/api/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      scopeNote: "",
      definition: "",
      skillType: SkillAPISpecs.Enums.SkillType.Knowledge,
      reuseLevel: SkillAPISpecs.Enums.ReuseLevel.CrossSector,
      isLocalized: true,
    });
  }

  describe("search (regex, unreleased model)", () => {
    test("GET with a query should return only the matching skills and pass schema validation", async () => {
      // GIVEN an unreleased model with three skills, two of which match the query
      const givenModelInfo = await createModelInDB();
      const givenModelId = givenModelInfo.id.toString();
      const pythonSkill = await createSkillWithLabel(givenModelId, "Python programming");
      const javaSkill = await createSkillWithLabel(givenModelId, "Java programming");
      await createSkillWithLabel(givenModelId, "Cooking");

      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId: givenModelId },
        path: `/models/${givenModelId}/skills`,
        queryStringParameters: { query: "programming", searchFields: "preferredLabel" },
      };

      // WHEN searching for "programming"
      // @ts-ignore
      const actualResponse = await skillHandler(givenEvent);

      // THEN expect a 200 and a schema-valid body containing exactly the two matching skills
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      const actualBody = JSON.parse(actualResponse.body);
      validateGETResponse(actualBody);
      expect(validateGETResponse.errors).toBeNull();
      const actualIds = (actualBody.data as ISkill[]).map((s) => s.id.toString());
      expect(new Set(actualIds)).toEqual(new Set([pythonSkill.id.toString(), javaSkill.id.toString()]));
    });

    test("GET with a query should paginate the matches and return a usable cursor", async () => {
      // GIVEN an unreleased model with three matching skills
      const givenModelInfo = await createModelInDB();
      const givenModelId = givenModelInfo.id.toString();
      for (let i = 0; i < 3; i++) {
        await createSkillWithLabel(givenModelId, `engineer number ${i}`);
      }

      // WHEN fetching the first page of size 2
      const firstEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId: givenModelId },
        path: `/models/${givenModelId}/skills`,
        queryStringParameters: { query: "engineer", limit: "2" },
      };
      // @ts-ignore
      const firstResponse = await skillHandler(firstEvent);
      expect(firstResponse.statusCode).toEqual(StatusCodes.OK);
      const firstBody = JSON.parse(firstResponse.body);
      expect(firstBody.data).toHaveLength(2);
      expect(firstBody.nextCursor).toBeTruthy();

      // AND fetching the next page with the returned cursor
      const secondEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId: givenModelId },
        path: `/models/${givenModelId}/skills`,
        queryStringParameters: { query: "engineer", limit: "2", cursor: firstBody.nextCursor },
      };
      // @ts-ignore
      const secondResponse = await skillHandler(secondEvent);
      expect(secondResponse.statusCode).toEqual(StatusCodes.OK);
      const secondBody = JSON.parse(secondResponse.body);

      // THEN expect the two pages to cover all three matches without overlap
      const firstIds = (firstBody.data as ISkill[]).map((s) => s.id.toString());
      const secondIds = (secondBody.data as ISkill[]).map((s) => s.id.toString());
      expect(secondIds).toHaveLength(1);
      expect(new Set([...firstIds, ...secondIds]).size).toBe(3);
    });

    test("GET should return BAD_REQUEST when searchFields is given without a query", async () => {
      // GIVEN a model
      const givenModelInfo = await createModelInDB();
      const givenModelId = givenModelInfo.id.toString();

      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId: givenModelId },
        path: `/models/${givenModelId}/skills`,
        queryStringParameters: { searchFields: "preferredLabel" },
      };

      // WHEN searching with searchFields but no query
      // @ts-ignore
      const actualResponse = await skillHandler(givenEvent);

      // THEN expect a BAD_REQUEST
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    });
  });

  describe("search (vector, released model)", () => {
    const givenEmbeddingServiceId = "test-embedding-service-id";
    let vectorSearchSpy: jest.SpyInstance | undefined;

    beforeEach(async () => {
      // Start each test from a clean embedding-process-state collection (the shared beforeEach only clears the
      // skills and models), and fake the query embedding so no real embedding provider is required.
      await getRepositoryRegistry().embeddingProcessState.Model.deleteMany({});
      (getEmbeddingModelService as jest.Mock).mockReturnValue({
        generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
        generateEmbeddingBatch: jest.fn(),
      });
    });

    afterEach(() => {
      vectorSearchSpy?.mockRestore();
      vectorSearchSpy = undefined;
    });

    // Creates a released model whose embeddings are marked complete, holding one skill per given label. The vector
    // search itself is stubbed by the caller, so the labels only need to be distinct, not semantically related.
    async function givenReleasedEmbeddedModelWithSkills(
      labels: string[]
    ): Promise<{ modelId: string; skills: ISkill[] }> {
      const givenModelInfo = await createModelInDB();
      const givenModelId = givenModelInfo.id.toString();
      // Release the model so the search takes the vector (embeddings) path rather than the regex fallback.
      await dbConnection!.models.ModelInfo.updateOne({ _id: givenModelInfo.id }, { $set: { released: true } });
      // A completed embedding process tells the service which embedding service the model was embedded with.
      await getRepositoryRegistry().embeddingProcessState.create({
        modelId: givenModelId,
        status: ModelInfoAPISpecs.ModelInfo.EmbeddingProcessStates.Enums.Status.COMPLETED,
        embeddingServiceId: givenEmbeddingServiceId,
        totalDocuments: labels.length,
        errorCounts: 0,
        warningCounts: 0,
        completedDocuments: labels.length,
      });
      const skills: ISkill[] = [];
      for (const label of labels) {
        skills.push(await createSkillWithLabel(givenModelId, label));
      }
      return { modelId: givenModelId, skills };
    }

    test("GET with a query should vector-search the skills and return them ranked by relevance", async () => {
      // GIVEN a released, embedded model holding three skills
      const { modelId, skills } = await givenReleasedEmbeddedModelWithSkills([
        "first skill",
        "second skill",
        "third skill",
      ]);
      // AND the vector search ranks them in an order different from their creation order
      const givenRanked = [skills[2], skills[0], skills[1]];
      vectorSearchSpy = jest
        .spyOn(getRepositoryRegistry().skillEmbedding, "vectorSearch")
        .mockResolvedValue(givenRanked.map((s, i) => ({ entityId: s.id.toString(), score: 1 - i * 0.1 })));

      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId },
        path: `/models/${modelId}/skills`,
        queryStringParameters: { query: "skill", searchFields: "preferredLabel,description" },
      };

      // WHEN searching for "skill"
      // @ts-ignore
      const actualResponse = await skillHandler(givenEvent);

      // THEN expect a 200 with a schema-valid body
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      const actualBody = JSON.parse(actualResponse.body);
      validateGETResponse(actualBody);
      expect(validateGETResponse.errors).toBeNull();
      // AND expect the skills to be returned in the relevance order the vector search ranked them
      const actualIds = (actualBody.data as ISkill[]).map((s) => s.id.toString());
      expect(actualIds).toEqual(givenRanked.map((s) => s.id.toString()));
      // AND expect the query to have been embedded with the model's embedding service and searched on the given fields
      expect(getEmbeddingModelService).toHaveBeenCalledWith(givenEmbeddingServiceId);
      expect(vectorSearchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          modelId,
          embeddingServiceId: givenEmbeddingServiceId,
          searchFields: [EmbeddableField.preferredLabel, EmbeddableField.description],
          offset: 0,
        })
      );
    });

    test("GET with a query should paginate the vector search using a relevance-offset cursor", async () => {
      // GIVEN a released, embedded model with three matching skills
      const { modelId, skills } = await givenReleasedEmbeddedModelWithSkills(["a skill", "b skill", "c skill"]);
      const limit = 2;
      // AND the first page's vector search returns limit + 1 hits (so there is a next page), the second the remainder
      vectorSearchSpy = jest
        .spyOn(getRepositoryRegistry().skillEmbedding, "vectorSearch")
        .mockResolvedValueOnce(skills.map((s, i) => ({ entityId: s.id.toString(), score: 1 - i * 0.1 })))
        .mockResolvedValueOnce([{ entityId: skills[2].id.toString(), score: 0.1 }]);

      // WHEN fetching the first page of size 2
      const firstEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId },
        path: `/models/${modelId}/skills`,
        queryStringParameters: { query: "skill", limit: limit.toString() },
      };
      // @ts-ignore
      const firstResponse = await skillHandler(firstEvent);
      expect(firstResponse.statusCode).toEqual(StatusCodes.OK);
      const firstBody = JSON.parse(firstResponse.body);
      // THEN expect the first page to hold `limit` skills and a usable next cursor
      expect(firstBody.data).toHaveLength(limit);
      expect(firstBody.nextCursor).toBeTruthy();

      // WHEN fetching the next page with the returned cursor
      const secondEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: { "Content-Type": "application/json" },
        pathParameters: { modelId },
        path: `/models/${modelId}/skills`,
        queryStringParameters: { query: "skill", limit: limit.toString(), cursor: firstBody.nextCursor },
      };
      // @ts-ignore
      const secondResponse = await skillHandler(secondEvent);
      expect(secondResponse.statusCode).toEqual(StatusCodes.OK);
      const secondBody = JSON.parse(secondResponse.body);

      // THEN expect the last skill on its own page and the second vector search to have skipped the first page
      expect(secondBody.data).toHaveLength(1);
      expect(vectorSearchSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ offset: limit }));
    });
  });
});
