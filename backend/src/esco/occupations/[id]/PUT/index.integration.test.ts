import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import { Connection } from "mongoose";

import OccupationAPISpecs from "api-specifications/esco/occupation";

import { getRandomString } from "_test_utilities/getMockRandomData";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { handler as occupationHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { usersRequestContext } from "_test_utilities/dataModel";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getMockRandomOccupationCode } from "_test_utilities/mockOccupationCode";
import { getMockRandomISCOGroupCode } from "_test_utilities/mockOccupationGroupCode";
import { ObjectTypes } from "esco/common/objectTypes";
import { getFallbackLanguageConfig } from "common/language/fallbackLanguage";

const FALLBACK_DB_KEY_NAME = getFallbackLanguageConfig().dbKeyName;

describe("Test for occupation PUT handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(OccupationAPISpecs.Occupation.PUT.Schemas.Response.Payload);
  const validatePUTResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.Occupation.PUT.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationPUTHandlerTestDB");
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
    }
  });

  test("PUT should respond with FORBIDDEN when user is not a model manager", async () => {
    // GIVEN a request from a non-model-manager user
    const givenModelId = getMockStringId(1);
    const givenPayload: OccupationAPISpecs.Occupation.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [{ [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) }],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect FORBIDDEN
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("PUT should respond with OK and response passes JSON schema validation", async () => {
    // GIVEN a model exists in the DB, supporting English and French
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND an occupation exists in the DB
    const givenOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [{ [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH) }],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    });

    // AND a valid PUT payload with updated data, preferredLabel translated in English and French
    const givenNewPayload: OccupationAPISpecs.Occupation.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { [FALLBACK_DB_KEY_NAME]: "Updated Label", fr: "Étiquette mise à jour" },
      description: { [FALLBACK_DB_KEY_NAME]: "Updated Description" },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: "Updated Definition" },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: "Updated Scope" },
      regulatedProfessionNote: { [FALLBACK_DB_KEY_NAME]: "Updated Note" },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenNewPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations/${givenOccupation.id}`,
      pathParameters: { modelId: givenModelId, id: givenOccupation.id },
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    // AND the response passes schema validation
    expect(validatePUTResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    // AND the preferred label (fallback language) has been updated
    expect(JSON.parse(actualResponse.body).preferredLabel).toEqual("Updated Label");
    // AND the persisted document carries both languages
    const actualDoc = await getRepositoryRegistry().occupation.Model.findById(givenOccupation.id).lean();
    expect(actualDoc?.preferredLabel).toEqual({ [FALLBACK_DB_KEY_NAME]: "Updated Label", fr: "Étiquette mise à jour" });
  });

  test("PUT should remove a language from a translatable field when the language is omitted from the payload", async () => {
    // GIVEN a model that supports English and French
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND an occupation exists with preferredLabel translated in both English and French
    const givenOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: { [FALLBACK_DB_KEY_NAME]: "Cook", fr: "Cuisinier" },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    });

    // AND a sanity check that French is actually stored before the PUT
    const beforeDoc = await getRepositoryRegistry().occupation.Model.findById(givenOccupation.id).lean();
    expect(beforeDoc?.preferredLabel).toMatchObject({ [FALLBACK_DB_KEY_NAME]: "Cook", fr: "Cuisinier" });

    // WHEN a PUT payload is sent whose preferredLabel carries only English (French omitted)
    const givenPutPayload: OccupationAPISpecs.Occupation.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: givenOccupation.code,
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { [FALLBACK_DB_KEY_NAME]: "Chef" },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: givenOccupation.occupationGroupCode,
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPutPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations/${givenOccupation.id}`,
      pathParameters: { modelId: givenModelId, id: givenOccupation.id },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);

    // AND the stored document's preferredLabel now carries only English — French has been removed, not merged
    const actualDoc = await getRepositoryRegistry().occupation.Model.findById(givenOccupation.id).lean();
    expect(actualDoc?.preferredLabel).toEqual({ [FALLBACK_DB_KEY_NAME]: "Chef" });
    expect(actualDoc?.preferredLabel).not.toHaveProperty("fr");
  });

  test("PUT should respond with BAD_REQUEST when preferredLabel is missing the fallback language", async () => {
    // GIVEN a model exists in the DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND an occupation exists in the DB
    const givenOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    });

    // AND a PUT payload whose preferredLabel omits the fallback language
    const givenPayload = {
      modelId: givenModelId,
      code: givenOccupation.code,
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { fr: "Cuisinier" },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: givenOccupation.occupationGroupCode,
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations/${givenOccupation.id}`,
      pathParameters: { modelId: givenModelId, id: givenOccupation.id },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("PUT should respond with BAD_REQUEST when a field uses a language unknown to the registry", async () => {
    // GIVEN a model exists in the DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND an occupation exists in the DB
    const givenOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    });

    // AND a PUT payload with a language unknown to the registry
    const givenPayload = {
      modelId: givenModelId,
      code: givenOccupation.code,
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { [FALLBACK_DB_KEY_NAME]: "Cook", tlh: "nuqneH" },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: givenOccupation.occupationGroupCode,
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations/${givenOccupation.id}`,
      pathParameters: { modelId: givenModelId, id: givenOccupation.id },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });

  test("PUT should respond with BAD_REQUEST when a field uses a language not in the model's availableLanguages", async () => {
    // GIVEN a model whose availableLanguages is only the fallback language
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en"],
    });
    const givenModelId = givenModel.id;

    // AND an occupation exists in the DB
    const givenOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    });

    // AND a PUT payload whose preferredLabel carries a language ('fr') not in the model's availableLanguages
    const givenPayload = {
      modelId: givenModelId,
      code: givenOccupation.code,
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { [FALLBACK_DB_KEY_NAME]: "Cook", fr: "Cuisinier" },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: givenOccupation.occupationGroupCode,
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations/${givenOccupation.id}`,
      pathParameters: { modelId: givenModelId, id: givenOccupation.id },
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect BAD_REQUEST, naming the field and the language
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
    const body = JSON.parse(actualResponse.body);
    expect(body.errorCode).toEqual(OccupationAPISpecs.Occupation.PUT.Errors.Status400.ErrorCodes.UNSUPPORTED_LANGUAGE);
    expect(body.message).toEqual("Field 'preferredLabel' uses a language not available in this model");
    expect(body.details).toEqual("Unsupported language: 'fr'");
  });

  test("PUT should respond with NOT_FOUND when occupation id does not exist", async () => {
    // GIVEN a model exists
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const givenNonExistentId = getMockStringId(99);
    const givenPayload: OccupationAPISpecs.Occupation.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: { [FALLBACK_DB_KEY_NAME]: "Label" },
      description: { [FALLBACK_DB_KEY_NAME]: "Desc" },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: "Def" },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: "Scope" },
      regulatedProfessionNote: { [FALLBACK_DB_KEY_NAME]: "Note" },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations/${givenNonExistentId}`,
      pathParameters: { modelId: givenModelId, id: givenNonExistentId },
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect NOT_FOUND
    expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
  });

  test("PUT should respond with OK when regulatedProfessionNote is a localized object with multiple languages", async () => {
    // GIVEN a model that supports English and French
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: ["en", "fr"],
    });
    const givenModelId = givenModel.id;

    // AND an occupation exists in the DB
    const givenOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: { [FALLBACK_DB_KEY_NAME]: "Not a regulated profession." },
      isLocalized: false,
    });

    // WHEN a PUT payload sets regulatedProfessionNote in both English and French
    const givenPayload: OccupationAPISpecs.Occupation.PUT.Types.Request.Payload = {
      modelId: givenModelId,
      code: givenOccupation.code,
      occupationType: OccupationAPISpecs.Enums.OccupationType.ESCOOccupation,
      preferredLabel: {
        [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.PREFERRED_LABEL_MAX_LENGTH),
      },
      description: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH) },
      altLabels: [],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: givenOccupation.occupationGroupCode,
      definition: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH) },
      scopeNote: { [FALLBACK_DB_KEY_NAME]: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH) },
      regulatedProfessionNote: {
        [FALLBACK_DB_KEY_NAME]: "Not a regulated profession.",
        fr: "Pas une profession réglementée.",
      },
      isLocalized: false,
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PUT,
      body: JSON.stringify(givenPayload),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations/${givenOccupation.id}`,
      pathParameters: { modelId: givenModelId, id: givenOccupation.id },
    };
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(validatePUTResponse(JSON.parse(actualResponse.body))).toBeTruthy();

    // AND the persisted document carries both languages
    const actualDoc = await getRepositoryRegistry().occupation.Model.findById(givenOccupation.id).lean();
    expect(actualDoc?.regulatedProfessionNote).toEqual({
      [FALLBACK_DB_KEY_NAME]: "Not a regulated profession.",
      fr: "Pas une profession réglementée.",
    });
  });
});
