import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { Connection } from "mongoose";

import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";

import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as skillGroupHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { ISkillGroup } from "../_shared/skillGroup.types";
import { getMockStringId } from "_test_utilities/mockMongoId";

import {
  createSkillGroupsInDB,
  linkSkillGroupToSkillChildrenInDB,
  createSkillsInDB,
  createModelInDB,
  createSkillGroupInDB,
} from "esco/_test_utilities/createDocsInDB";

describe("Test for skillGroup handler with a DB", () => {
  // setup the ajv validate GET, POST, etc response functions
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv
    .addSchema(SkillGroupAPISpecs.GET.Schemas.Response.Payload)
    .addSchema(SkillGroupAPISpecs.POST.Schemas.Response.Payload);
  const validateGETResponse: ValidateFunction = ajv.getSchema(
    SkillGroupAPISpecs.GET.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    // using the in-memory mongodb instance that is started up with @shelf/jest-mongodb
    const config = getTestConfiguration("SkillGroupHandlerTestDB");
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
      await dbConnection.models.SkillGroupModel.deleteMany({});
      await dbConnection.models.SkillModel.deleteMany({});
      await dbConnection.models.SkillHierarchyModel.deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });
  test("GET should respond with the OK status code and the response passes the JSON Schema validation", async () => {
    // GIVEN several skillGroup objects are in the DB
    const givenModelInfo = await createModelInDB();

    const skillGroups = await createSkillGroupsInDB(3, givenModelInfo.id.toString());
    expect(skillGroups.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 2;
    const cursor = Buffer.from(JSON.stringify({ id: skillGroups[2].id, createdAt: skillGroups[2].createdAt })).toString(
      "base64"
    );

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups`,
      queryStringParameters: {
        limit: limit.toString(),
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await skillGroupHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND an skillGroup object that validates against the SkillGroupResponseGET schema
    validateGETResponse(JSON.parse(actualResponse.body));
    expect(validateGETResponse.errors).toBeNull();
  });

  test("GET should return at most the passed limit skillGroups", async () => {
    // GIVEN several SkillGroup objects are in the DB
    const givenModelInfo = await createModelInDB();
    const skillGroups = await createSkillGroupsInDB(10, givenModelInfo.id.toString());
    expect(skillGroups.length).toBeGreaterThan(0); // guard to ensue that we actually have models in the DB
    const limit = 5;
    const cursor = Buffer.from(JSON.stringify({ id: skillGroups[8].id, createdAt: skillGroups[8].createdAt })).toString(
      "base64"
    );

    // AND a valid request (method & header)
    const givenEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: {
        "Content-Type": "application/json",
      },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups`,
      queryStringParameters: {
        limit: limit,
        cursor: cursor,
      },
    };

    // WHEN the handler is invoked with the given event
    // @ts-ignore
    const actualResponse = await skillGroupHandler(givenEvent);

    // THEN expect the handler to respond with the OK status code
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    const actualBody = JSON.parse(actualResponse.body);
    const actualSkillGroups = actualBody.data as ISkillGroup[];

    // AND the response skillGroups should have at most of the limit count of SkillGroups
    expect(actualSkillGroups.length).toBeLessThanOrEqual(limit);

    // AND the response skillGroups should be the expected ones
    // The cursor points to skillGroups[8], so with descending order we expect the 5 items older than that
    // which are skillGroups[7, 6, 5, 4, 3] in descending order (newest to oldest of those)
    expect(actualSkillGroups.map((m) => m.UUID)).toMatchObject(
      skillGroups
        .slice(3, 8)
        .reverse()
        .map((m) => m.UUID)
    );
  });

  test("GET should paginate without skipping items when chaining nextCursor", async () => {
    // GIVEN five skillGroups in the DB
    const givenModelInfo = await createModelInDB();
    await createSkillGroupsInDB(5, givenModelInfo.id.toString());

    // Baseline: get first 3 to capture the server’s ordering
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: { limit: "3" },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups`,
    };
    // @ts-ignore
    const baselineResponse = await skillGroupHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as ISkillGroup[]).map((m) => m.id.toString());
    expect(baselineIds).toHaveLength(3);

    // Page 1 (single): limit=1, no cursor
    const page1Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: { limit: "1" },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups`,
    };
    // @ts-ignore
    const page1Response = await skillGroupHandler(page1Event);
    expect(page1Response.statusCode).toEqual(StatusCodes.OK);
    const page1Body = JSON.parse(page1Response.body);
    const page1Ids = (page1Body.data as ISkillGroup[]).map((m) => m.id.toString());
    expect(page1Ids).toEqual(baselineIds.slice(0, 1));
    expect(page1Body.nextCursor).toBeDefined();

    // Page 2 (single): limit=1 with cursor from page1
    const page2Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: { limit: "1", cursor: page1Body.nextCursor },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups`,
    };
    // @ts-ignore
    const page2Response = await skillGroupHandler(page2Event);
    expect(page2Response.statusCode).toEqual(StatusCodes.OK);
    const page2Body = JSON.parse(page2Response.body);
    const page2Ids = (page2Body.data as ISkillGroup[]).map((m) => m.id.toString());
    expect(page2Ids).toEqual(baselineIds.slice(1, 2));
    expect(page2Body.nextCursor).toBeDefined();

    // Page 3 (single): limit=1 with cursor from page2
    const page3Event = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: { limit: "1", cursor: page2Body.nextCursor },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups`,
    };
    // @ts-ignore
    const page3Response = await skillGroupHandler(page3Event);
    expect(page3Response.statusCode).toEqual(StatusCodes.OK);
    const page3Body = JSON.parse(page3Response.body);
    const page3Ids = (page3Body.data as ISkillGroup[]).map((m) => m.id.toString());

    // THEN chained singles reconstruct the baseline first 3
    const chained = [...page1Ids, ...page2Ids, ...page3Ids];
    expect(chained).toEqual(baselineIds);
  });

  test("GET should paginate correctly across random page sizes", async () => {
    // GIVEN twenty skillGroups in the DB
    const givenModelInfo = await createModelInDB();
    await createSkillGroupsInDB(20, givenModelInfo.id.toString());

    // Baseline: first 20 to know expected order
    const baselineEvent = {
      httpMethod: HTTP_VERBS.GET,
      headers: { "Content-Type": "application/json" },
      pathParameters: { modelId: givenModelInfo.id.toString() },
      queryStringParameters: { limit: "20" },
      path: `/models/${givenModelInfo.id.toString()}/skillGroups`,
    };
    // @ts-ignore
    const baselineResponse = await skillGroupHandler(baselineEvent);
    expect(baselineResponse.statusCode).toEqual(StatusCodes.OK);
    const baselineBody = JSON.parse(baselineResponse.body);
    const baselineIds = (baselineBody.data as ISkillGroup[]).map((m) => m.id.toString());
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
        path: `/models/${givenModelInfo.id.toString()}/skillGroups`,
      };
      // @ts-ignore
      const resp = await skillGroupHandler(event);
      expect(resp.statusCode).toEqual(StatusCodes.OK);
      const body = JSON.parse(resp.body);
      const ids = (body.data as ISkillGroup[]).map((m) => m.id.toString());
      collected.push(...ids);
      cursor = body.nextCursor || undefined;
      if (!cursor) break; // no more pages
    }

    // THEN the collected IDs equal the baseline IDs
    expect(collected.slice(0, baselineIds.length)).toEqual(baselineIds);
  });

  describe("GET filtering skillGroups by children skill ids", () => {
    test("GET should return the parent skillGroup when filtering by the ids of its three child skills", async () => {
      // GIVEN a taxonomy model exists in the DB
      const givenModelInfo = await createModelInDB();
      const givenModelId = givenModelInfo.id.toString();

      // AND two parent skillGroups exists in that model
      const [givenParentSkillGroup, anotherSkillGroup] = await createSkillGroupsInDB(2, givenModelId);

      // AND three skills exist in that model
      const givenChildSkills = await createSkillsInDB(3, givenModelId);
      expect(givenChildSkills).toHaveLength(3); // guard to ensure the children were actually created

      // AND another skillGroup exists in the same model that is not a parent of those skills
      const givenUnrelatedSkillGroup = await createSkillGroupInDB(givenModelId);

      // AND the parent skillGroup is linked to the three skills as its children in the hierarchy
      await linkSkillGroupToSkillChildrenInDB(givenModelId, givenParentSkillGroup, givenChildSkills);

      // AND another skill group has n skills
      await linkSkillGroupToSkillChildrenInDB(givenModelId, anotherSkillGroup, await createSkillsInDB(5, givenModelId));

      // AND a valid request that filters by the three child skill ids and the Skill children type
      const givenChildrenIds = givenChildSkills.map((skill) => skill.id.toString()).join(";");
      const givenChildrenType = SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.Skill;
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModelId },
        path: `/models/${givenModelId}/skillGroups`,
        queryStringParameters: {
          childrenIds: givenChildrenIds,
          childrenType: givenChildrenType,
        },
      };

      // WHEN the handler is invoked with the given event
      // @ts-ignore
      const actualResponse = await skillGroupHandler(givenEvent);

      // THEN expect the handler to respond with the OK status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

      // AND the response to validate against the SkillGroupResponseGET schema
      const actualBody = JSON.parse(actualResponse.body);
      validateGETResponse(actualBody);
      expect(validateGETResponse.errors).toBeNull();

      // AND the response to contain exactly the parent skillGroup of the three child skills
      const actualSkillGroups = actualBody.data as ISkillGroup[];
      expect(actualSkillGroups).toHaveLength(1);
      expect(actualSkillGroups[0].id.toString()).toEqual(givenParentSkillGroup.id.toString());

      // AND the unrelated skillGroup to not be included in the response
      expect(actualSkillGroups.map((skillGroup) => skillGroup.id.toString())).not.toContain(
        givenUnrelatedSkillGroup.id.toString()
      );
    });

    test("GET should return an empty array when filtering by random skill ids that are not children of any skillGroup", async () => {
      // GIVEN a model exists in the DB
      const givenModelInfo = await createModelInDB();
      const givenModelId = givenModelInfo.id.toString();

      // AND a parent skillGroup linked to three child skills exists in that model
      const givenParentSkillGroup = await createSkillGroupInDB(givenModelId);
      const givenChildSkills = await createSkillsInDB(3, givenModelId);
      await linkSkillGroupToSkillChildrenInDB(givenModelId, givenParentSkillGroup, givenChildSkills);

      // AND a valid request that filters by random skill ids that are not children of any skillGroup
      const givenRandomChildrenIds = [getMockStringId(900), getMockStringId(901), getMockStringId(902)].join(";");
      const givenChildrenType = SkillGroupAPISpecs.Enums.Relations.Children.ObjectTypes.Skill;
      const givenEvent = {
        httpMethod: HTTP_VERBS.GET,
        headers: {
          "Content-Type": "application/json",
        },
        pathParameters: { modelId: givenModelId },
        path: `/models/${givenModelId}/skillGroups`,
        queryStringParameters: {
          childrenIds: givenRandomChildrenIds,
          childrenType: givenChildrenType,
        },
      };

      // WHEN the handler is invoked with the given event
      // @ts-ignore
      const actualResponse = await skillGroupHandler(givenEvent);

      // THEN expect the handler to respond with the OK status code
      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

      // AND the response to validate against the SkillGroupResponseGET schema
      const actualBody = JSON.parse(actualResponse.body);
      validateGETResponse(actualBody);
      expect(validateGETResponse.errors).toBeNull();

      // AND the response to contain an empty array of skillGroups
      const actualSkillGroups = actualBody.data as ISkillGroup[];
      expect(actualSkillGroups).toEqual([]);
    });
  });
});
