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

describe("Test for occupationGroup PATCH handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload);
  const validatePATCHResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.OccupationGroup.PATCH.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupPATCHHandlerTestDB");
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

  function buildEvent(modelId: string, id: string, payload: unknown) {
    return {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${modelId}/occupationGroups/${id}`,
      pathParameters: { modelId, id },
    } as unknown as APIGatewayProxyEvent;
  }

  test("PATCH should merge per language, leaving the fallback language untouched when only French is sent", async () => {
    // GIVEN an occupation group translated in the fallback language and in French
    const { givenModelId, givenOccupationGroup } = await givenOccupationGroupInDB();
    // AND a payload with a French preferredLabel only
    const givenPayload: OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Request.Payload = {
      preferredLabel: { fr: "Nouveaux directeurs" },
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(
      buildEvent(givenModelId, givenOccupationGroup.id, givenPayload)
    );

    // THEN expect OK and a response that passes the schema validation
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validatePATCHResponse(actualBody)).toBeTruthy();
    expect(actualBody.preferredLabel).toEqual("Managers");
    // AND the French preferredLabel to be updated, the other fields untouched
    const actualRawDoc = await getRepositoryRegistry().OccupationGroup.Model.findById(givenOccupationGroup.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual({ en: "Managers", fr: "Nouveaux directeurs" });
    expect(actualRawDoc?.description).toEqual({ en: "A description", fr: "Une description" });
    expect(actualRawDoc?.altLabels).toEqual([{ en: "Executives", fr: "Cadres" }]);
  });

  test("PATCH should apply a multi language payload, deleting a language set to null", async () => {
    // GIVEN an occupation group translated in the fallback language and in French
    const { givenModelId, givenOccupationGroup } = await givenOccupationGroupInDB();
    // AND a multi language payload that deletes the French description
    const givenPayload: OccupationGroupAPISpecs.OccupationGroup.PATCH.Types.Request.Payload = {
      preferredLabel: { en: "Updated managers", fr: "Nouveaux directeurs" },
      description: { fr: null },
      altLabels: [{ en: "Chiefs", fr: "Chefs" }],
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(
      buildEvent(givenModelId, givenOccupationGroup.id, givenPayload)
    );

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the languages to be set, the French description deleted and the altLabels replaced
    const actualRawDoc = await getRepositoryRegistry().OccupationGroup.Model.findById(givenOccupationGroup.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual(givenPayload.preferredLabel);
    expect(actualRawDoc?.description).toEqual({ en: "A description" });
    expect(actualRawDoc?.altLabels).toEqual(givenPayload.altLabels);
  });

  test("PATCH should respond with UNSUPPORTED_LANGUAGE when a language is not available in the model", async () => {
    // GIVEN an occupation group exists in a model available in the fallback language and in French
    const { givenModelId, givenOccupationGroup } = await givenOccupationGroupInDB();
    // AND a payload with a Spanish preferredLabel
    const givenPayload = { preferredLabel: { es: "Gerentes" } };

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(
      buildEvent(givenModelId, givenOccupationGroup.id, givenPayload)
    );

    // THEN expect BAD_REQUEST naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode:
        OccupationGroupAPISpecs.OccupationGroup.PATCH.Errors.Response.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE,
      message: "Field 'preferredLabel' uses a language not available in this model",
      details: "Unsupported language: 'es'",
    });
    // AND the occupation group to be unchanged
    const actualRawDoc = await getRepositoryRegistry().OccupationGroup.Model.findById(givenOccupationGroup.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual({ en: "Managers", fr: "Directeurs" });
  });

  test.each([
    [
      "uses a language that is not in the registry",
      { preferredLabel: { en: "Managers", tlh: "nuqneH" } },
      "/preferredLabel",
    ],
    [
      "has a value longer than the maximum length in one language only",
      { preferredLabel: { fr: "a".repeat(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH + 1) } },
      "/preferredLabel/fr",
    ],
    ["deletes the fallback language", { preferredLabel: { en: null } }, "/preferredLabel/en"],
  ])("PATCH should respond with BAD_REQUEST when the payload %s", async (_description, givenPayload, expectedPath) => {
    // GIVEN an occupation group exists
    const { givenModelId, givenOccupationGroup } = await givenOccupationGroupInDB();

    // WHEN the handler is invoked with an invalid payload
    const actualResponse = await occupationGroupHandler(
      buildEvent(givenModelId, givenOccupationGroup.id, givenPayload)
    );

    // THEN expect BAD_REQUEST naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body).details).toContain(expectedPath);
    // AND the occupation group to be unchanged
    const actualRawDoc = await getRepositoryRegistry().OccupationGroup.Model.findById(givenOccupationGroup.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual({ en: "Managers", fr: "Directeurs" });
  });
});
