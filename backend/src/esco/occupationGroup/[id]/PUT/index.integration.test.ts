import "_test_utilities/consoleMock";
import { APIGatewayProxyEvent } from "aws-lambda";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getNewISCOGroupSpecsWithoutImportId } from "esco/_test_utilities/getNewSpecs";
import { handler as occupationGroupHandler } from "./index";

describe("Test for occupationGroup PUT handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Response.Payload);
  const validatePUTResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.OccupationGroup.PUT.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupPUTHandlerTestDB");
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
      await dbConnection.models.OccupationGroupModel.deleteMany({});
      await dbConnection.models.ModelInfo.deleteMany({});
    }
  });

  // GIVEN a model available in the fallback language and in French, with an occupation group translated in both
  async function givenOccupationGroupInDB() {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenOccupationGroup = await getRepositoryRegistry().OccupationGroup.create({
      ...getNewISCOGroupSpecsWithoutImportId(),
      modelId: givenModel.id,
      preferredLabel: { en: "Managers", fr: "Directeurs" },
      description: { en: "A description", fr: "Une description" },
      altLabels: [{ en: "Executives", fr: "Cadres" }],
    });
    return { givenModelId: givenModel.id, givenOccupationGroup };
  }

  function getGivenPayload(
    modelId: string,
    code: string
  ): OccupationGroupAPISpecs.OccupationGroup.PUT.Types.Request.Payload {
    return {
      modelId,
      code,
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: { en: "Updated managers" },
      description: { en: "Updated description" },
      altLabels: [{ en: "Chiefs" }],
      originUri: "https://example.com/updated",
      UUIDHistory: [randomUUID()],
    };
  }

  function buildEvent(modelId: string, id: string, payload: unknown) {
    return {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${modelId}/occupationGroups/${id}`,
      pathParameters: { modelId, id },
    } as unknown as APIGatewayProxyEvent;
  }

  test("PUT should replace the whole localized value, removing the languages omitted from a single language payload", async () => {
    // GIVEN an occupation group translated in the fallback language and in French
    const { givenModelId, givenOccupationGroup } = await givenOccupationGroupInDB();
    // AND a single language payload
    const givenPayload = getGivenPayload(givenModelId, givenOccupationGroup.code);

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(
      buildEvent(givenModelId, givenOccupationGroup.id, givenPayload)
    );

    // THEN expect OK and a response that passes the schema validation
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validatePUTResponse(actualBody)).toBeTruthy();
    expect(actualBody.preferredLabel).toEqual("Updated managers");
    // AND the French translations to be removed
    const actualRawDoc = await getRepositoryRegistry().OccupationGroup.Model.findById(givenOccupationGroup.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual(givenPayload.preferredLabel);
    expect(actualRawDoc?.description).toEqual(givenPayload.description);
    expect(actualRawDoc?.altLabels).toEqual(givenPayload.altLabels);
  });

  test("PUT should store every language of a multi language payload", async () => {
    // GIVEN an occupation group exists
    const { givenModelId, givenOccupationGroup } = await givenOccupationGroupInDB();
    // AND a multi language payload
    const givenPayload = {
      ...getGivenPayload(givenModelId, givenOccupationGroup.code),
      preferredLabel: { en: "Updated managers", fr: "Nouveaux directeurs" },
      altLabels: [{ en: "Chiefs", fr: "Chefs" }],
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(
      buildEvent(givenModelId, givenOccupationGroup.id, givenPayload)
    );

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND every language to be stored
    const actualRawDoc = await getRepositoryRegistry().OccupationGroup.Model.findById(givenOccupationGroup.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual(givenPayload.preferredLabel);
    expect(actualRawDoc?.altLabels).toEqual(givenPayload.altLabels);
  });

  test("PUT should respond with UNSUPPORTED_LANGUAGE when a language is not available in the model", async () => {
    // GIVEN an occupation group exists in a model available in the fallback language and in French
    const { givenModelId, givenOccupationGroup } = await givenOccupationGroupInDB();
    // AND a payload with a Spanish altLabel
    const givenPayload = {
      ...getGivenPayload(givenModelId, givenOccupationGroup.code),
      altLabels: [{ en: "Chiefs", es: "Jefes" }],
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(
      buildEvent(givenModelId, givenOccupationGroup.id, givenPayload)
    );

    // THEN expect BAD_REQUEST naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: OccupationGroupAPISpecs.OccupationGroup.PUT.Errors.Response.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE,
      message: "Field 'altLabels' uses a language not available in this model",
      details: "Unsupported language: 'es'",
    });
    // AND the occupation group to be unchanged
    const actualRawDoc = await getRepositoryRegistry().OccupationGroup.Model.findById(givenOccupationGroup.id).lean();
    expect(actualRawDoc?.altLabels).toEqual([{ en: "Executives", fr: "Cadres" }]);
  });

  test.each([
    [
      "uses a language that is not in the registry",
      { preferredLabel: { en: "Managers", tlh: "nuqneH" } },
      "/preferredLabel",
    ],
    [
      "has a value longer than the maximum length in one language only",
      {
        preferredLabel: {
          en: "Managers",
          fr: "a".repeat(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH + 1),
        },
      },
      "/preferredLabel/fr",
    ],
    ["removes the fallback language", { preferredLabel: { fr: "Directeurs" } }, "/preferredLabel"],
  ])("PUT should respond with BAD_REQUEST when the payload %s", async (_description, givenOverrides, expectedPath) => {
    // GIVEN an occupation group exists
    const { givenModelId, givenOccupationGroup } = await givenOccupationGroupInDB();
    // AND an invalid payload
    const givenPayload = { ...getGivenPayload(givenModelId, givenOccupationGroup.code), ...givenOverrides };

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(
      buildEvent(givenModelId, givenOccupationGroup.id, givenPayload)
    );

    // THEN expect BAD_REQUEST naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).details).toContain(expectedPath);
  });
});
