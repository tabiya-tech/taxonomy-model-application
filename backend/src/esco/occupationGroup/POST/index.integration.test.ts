import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";

import { getRandomString, getTestString } from "_test_utilities/getMockRandomData";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { StatusCodes } from "server/httpUtils";
import { handler as occupationGroupHandler } from "./index";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LocaleAPISpecs from "api-specifications/locale";

async function createModelInDB(availableLanguages?: string[]) {
  return await getRepositoryRegistry().modelInfo.create({
    availableLanguages,
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

describe("Test for occupationGroup POST handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.POST.Schemas.Response.Payload);
  const validatePOSTResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.POST.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupPostHandlerTestDB");
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

  function buildEvent(modelId: string, payload: unknown) {
    return {
      httpMethod: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
      path: `/models/${modelId}/occupationGroups`,
      pathParameters: { modelId },
      requestContext: usersRequestContext.MODEL_MANAGER,
    };
  }

  function getGivenPayload(modelId: string): OccupationGroupAPISpecs.POST.Types.Request.Payload {
    return {
      modelId,
      code: getMockRandomISCOGroupCode(),
      groupType: OccupationGroupAPISpecs.Enums.ObjectTypes.ISCOGroup,
      preferredLabel: { en: getRandomString(OccupationGroupAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH) },
      description: { en: getTestString(OccupationGroupAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [{ en: getRandomString(OccupationGroupAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) }],
      originUri: `https://example.com/resources/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
    };
  }

  test("POST /occupationGroups should create an occupation group from a single language payload", async () => {
    // GIVEN a model exists
    const givenModelInfo = await createModelInDB();
    // AND a payload in the fallback language only
    const givenPayload = getGivenPayload(givenModelInfo.id);

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(buildEvent(givenModelInfo.id, givenPayload) as never);

    // THEN expect CREATED
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    // AND the response to pass the schema validation
    const actualBody = JSON.parse(actualResponse.body);
    expect(validatePOSTResponse(actualBody)).toBeTruthy();
    expect(actualBody.modelId).toEqual(givenModelInfo.id);
    expect(actualBody.code).toEqual(givenPayload.code);
    expect(actualBody.preferredLabel).toEqual(givenPayload.preferredLabel.en);
  });

  test("POST /occupationGroups should store every language of a multi language payload", async () => {
    // GIVEN a model exists that is available in the fallback language and in French
    const givenModelInfo = await createModelInDB(["en", "fr"]);
    // AND a payload translated in both languages
    const givenPayload: OccupationGroupAPISpecs.POST.Types.Request.Payload = {
      ...getGivenPayload(givenModelInfo.id),
      preferredLabel: { en: "Managers", fr: "Directeurs" },
      description: { en: "A description", fr: "Une description" },
      altLabels: [{ en: "Executives", fr: "Cadres" }],
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(buildEvent(givenModelInfo.id, givenPayload) as never);

    // THEN expect CREATED with the fallback language in the response
    expect(actualResponse.statusCode).toEqual(StatusCodes.CREATED);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validatePOSTResponse(actualBody)).toBeTruthy();
    expect(actualBody.preferredLabel).toEqual("Managers");
    // AND every language to be stored
    const actualRawDoc = await getRepositoryRegistry().OccupationGroup.Model.findById(actualBody.id).lean();
    expect(actualRawDoc?.preferredLabel).toEqual(givenPayload.preferredLabel);
    expect(actualRawDoc?.description).toEqual(givenPayload.description);
    expect(actualRawDoc?.altLabels).toEqual(givenPayload.altLabels);
  });

  test("POST /occupationGroups should respond with UNSUPPORTED_LANGUAGE when a language is not available in the model", async () => {
    // GIVEN a model exists that is only available in the fallback language
    const givenModelInfo = await createModelInDB();
    // AND a payload with a French description
    const givenPayload = { ...getGivenPayload(givenModelInfo.id), description: { en: "A", fr: "Une" } };

    // WHEN the handler is invoked
    const actualResponse = await occupationGroupHandler(buildEvent(givenModelInfo.id, givenPayload) as never);

    // THEN expect BAD_REQUEST naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    expect(JSON.parse(actualResponse.body)).toEqual({
      errorCode: OccupationGroupAPISpecs.POST.Enums.Response.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE,
      message: "Field 'description' uses a language not available in this model",
      details: "Unsupported language: 'fr'",
    });
    // AND nothing to be stored
    expect(await getRepositoryRegistry().OccupationGroup.Model.countDocuments()).toEqual(0);
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
    ["omits the fallback language", { preferredLabel: { fr: "Directeurs" } }, "/preferredLabel"],
  ])(
    "POST /occupationGroups should respond with BAD_REQUEST when the payload %s",
    async (_description, givenOverrides, expectedPath) => {
      // GIVEN a model exists that is available in the fallback language and in French
      const givenModelInfo = await createModelInDB(["en", "fr"]);
      // AND an invalid payload
      const givenPayload = { ...getGivenPayload(givenModelInfo.id), ...givenOverrides };

      // WHEN the handler is invoked
      const actualResponse = await occupationGroupHandler(buildEvent(givenModelInfo.id, givenPayload) as never);

      // THEN expect BAD_REQUEST naming the field and the language
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).details).toContain(expectedPath);
    }
  );
});
