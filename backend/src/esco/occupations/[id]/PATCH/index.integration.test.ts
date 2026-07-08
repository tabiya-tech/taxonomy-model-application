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

describe("Test for occupation PATCH handler with a DB", () => {
  const ajv = new Ajv({ validateSchema: true, strict: true, allErrors: true });
  addFormats(ajv);
  ajv.addSchema(OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload);
  const validatePATCHResponse: ValidateFunction = ajv.getSchema(
    OccupationAPISpecs.Occupation.PATCH.Schemas.Response.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationPATCHHandlerTestDB");
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

  test("PATCH should respond with FORBIDDEN when user is not a model manager", async () => {
    // GIVEN a request from a non-model-manager user
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.REGISTED_USER,
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect FORBIDDEN
    expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
  });

  test("PATCH should respond with OK, only update provided fields, and response passes JSON schema validation", async () => {
    // GIVEN a model exists in the DB
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const givenOriginalLabel = "Original Label";

    // AND an occupation exists in the DB
    const givenOccupation = await getRepositoryRegistry().occupation.create({
      modelId: givenModelId,
      code: getMockRandomOccupationCode(false),
      occupationType: ObjectTypes.ESCOOccupation,
      preferredLabel: givenOriginalLabel,
      description: getRandomString(OccupationAPISpecs.Constants.DESCRIPTION_MAX_LENGTH),
      altLabels: [getRandomString(OccupationAPISpecs.Constants.ALT_LABEL_MAX_LENGTH)],
      originUri: `http://some/path/${randomUUID()}`,
      UUIDHistory: [randomUUID()],
      occupationGroupCode: getMockRandomISCOGroupCode(),
      definition: getRandomString(OccupationAPISpecs.Constants.DEFINITION_MAX_LENGTH),
      scopeNote: getRandomString(OccupationAPISpecs.Constants.SCOPE_NOTE_MAX_LENGTH),
      regulatedProfessionNote: getRandomString(OccupationAPISpecs.Constants.REGULATED_PROFESSION_NOTE_MAX_LENGTH),
      isLocalized: false,
    });

    // AND a PATCH payload that only updates description
    const givenPatchPayload: OccupationAPISpecs.Occupation.PATCH.Types.Request.Payload = {
      description: "Patched Description Only",
    };
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify(givenPatchPayload),
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
    expect(validatePATCHResponse(JSON.parse(actualResponse.body))).toBeTruthy();
    const responseBody = JSON.parse(actualResponse.body);
    // AND description has been updated
    expect(responseBody.description).toEqual("Patched Description Only");
    // AND preferredLabel is unchanged
    expect(responseBody.preferredLabel).toEqual(givenOriginalLabel);
  });

  test("PATCH should respond with NOT_FOUND when occupation id does not exist", async () => {
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
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: JSON.stringify({ preferredLabel: "Label" }),
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

  test("PATCH should respond with BAD_REQUEST when body is null", async () => {
    // GIVEN a request with null body
    const givenModelId = getMockStringId(1);
    const givenEvent = {
      httpMethod: HTTP_VERBS.PATCH,
      body: null,
      headers: { "Content-Type": "application/json" },
      requestContext: usersRequestContext.MODEL_MANAGER,
      path: `/models/${givenModelId}/occupations/${getMockStringId(2)}`,
    };

    // WHEN the handler is invoked
    const actualResponse = await occupationHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect BAD_REQUEST
    expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
  });
});
