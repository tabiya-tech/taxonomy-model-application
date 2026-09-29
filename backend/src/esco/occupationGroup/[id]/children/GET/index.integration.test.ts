import { APIGatewayProxyEvent } from "aws-lambda";
import "_test_utilities/consoleMock";
import Ajv, { ValidateFunction } from "ajv";
import { randomUUID } from "node:crypto";
import mongoose, { Connection } from "mongoose";

import OccupationGroupAPISpecs from "api-specifications/esco/occupationGroup";
import LanguageAPISpecs from "api-specifications/language";

import { StatusCodes } from "server/httpUtils";
import { handler as occupationGroupChildrenHandler } from "./index";
import addFormats from "ajv-formats";
import { initOnce } from "server/init";
import { getConnectionManager } from "server/connection/connectionManager";
import { getTestConfiguration } from "_test_utilities/getTestConfiguration";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ObjectTypes } from "esco/common/objectTypes";
import { getSimpleNewISCOGroupSpec, getSimpleNewISCOGroupSpecWithParentCode } from "esco/_test_utilities/getNewSpecs";

describe("Test for occupation Children GET handler with a DB", () => {
  const ajv = new Ajv({
    validateSchema: true,
    strict: true,
    allErrors: true,
  });
  addFormats(ajv);
  ajv.addSchema(OccupationGroupAPISpecs.OccupationGroup.Children.GET.Schemas.Response.Children.Payload);
  const validateChildrenResponse: ValidateFunction = ajv.getSchema(
    OccupationGroupAPISpecs.OccupationGroup.Children.GET.Schemas.Response.Children.Payload.$id as string
  ) as ValidateFunction;

  let dbConnection: Connection | undefined;
  beforeAll(async () => {
    const config = getTestConfiguration("OccupationGroupChildrenHandlerTestDB");
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

  test("GET /occupationGroups/{id}/children should return the children of the occupation group", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenModelId = givenModel.id;
    const repository = getRepositoryRegistry().OccupationGroup;
    const givenParent = await repository.create({
      ...getSimpleNewISCOGroupSpec(givenModelId, "parent"),
      originUri: "https://example.com/occupation-groups/parent",
      description: "Parent occupation group",
    });
    const givenChild = await repository.create({
      ...getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "child_1", givenParent.code),
      originUri: "https://example.com/occupation-groups/child-1",
      description: "Child occupation group",
    });

    await getRepositoryRegistry().occupationHierarchy.createMany(givenModelId, [
      {
        parentId: givenParent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: givenChild.id,
        childType: ObjectTypes.ISCOGroup,
      },
    ]);

    const givenEvent = {
      httpMethod: "GET",
      path: `/models/${givenModelId}/occupationGroups/${givenParent.id}/children`,
      pathParameters: { modelId: givenModelId, id: givenParent.id },
    };
    const actualResponse = await occupationGroupChildrenHandler(givenEvent as unknown as APIGatewayProxyEvent);
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    const actualBody = JSON.parse(actualResponse.body);
    expect(validateChildrenResponse(actualBody)).toBeTruthy();
    expect(actualBody.data[0].id).toEqual(givenChild.id);
  });

  test("GET should set Content-Language and Vary response headers", async () => {
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
    });
    const givenParent = await getRepositoryRegistry().OccupationGroup.create(
      getSimpleNewISCOGroupSpec(givenModel.id, "parent")
    );

    const givenEvent = {
      httpMethod: "GET",
      headers: {},
      path: `/models/${givenModel.id}/occupationGroups/${givenParent.id}/children`,
      pathParameters: { modelId: givenModel.id, id: givenParent.id },
    };

    const actualResponse = await occupationGroupChildrenHandler(givenEvent as unknown as APIGatewayProxyEvent);

    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(actualResponse.headers?.["Content-Language"]).toEqual(
      LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode
    );
    expect(actualResponse.headers?.["Vary"]).toEqual("Accept-Language");
  });

  test("GET should fall back per field to the fallback language for a child untranslated in the requested language", async () => {
    // GIVEN a model with English and French as available languages
    const FALLBACK_LANG = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE;
    const SECONDARY_LANG = LanguageAPISpecs.Constants.Languages[1]; // French
    const givenModel = await getRepositoryRegistry().modelInfo.create({
      name: "Test Model",
      description: "Test Description",
      locale: { shortCode: "en", name: "English", UUID: randomUUID() },
      license: "MIT",
      UUIDHistory: [],
      availableLanguages: [FALLBACK_LANG.shortCode, SECONDARY_LANG.shortCode],
    });
    const givenModelId = givenModel.id;
    const repository = getRepositoryRegistry().OccupationGroup;
    const givenParent = await repository.create(getSimpleNewISCOGroupSpec(givenModelId, "parent"));
    const givenChild = await repository.create(
      getSimpleNewISCOGroupSpecWithParentCode(givenModelId, "child_1", givenParent.code)
    );
    await getRepositoryRegistry().occupationHierarchy.createMany(givenModelId, [
      {
        parentId: givenParent.id,
        parentType: ObjectTypes.ISCOGroup,
        childId: givenChild.id,
        childType: ObjectTypes.ISCOGroup,
      },
    ]);

    // AND the child's preferredLabel is translated in both languages, description only in the fallback
    // language, and one altLabels item has neither language (findChildren's raw aggregation must resolve
    // each field independently, falling back to "" rather than null, and dropping an untranslated item
    // rather than keeping it as null)
    await repository.Model.collection.updateOne(
      { _id: new mongoose.Types.ObjectId(givenChild.id) },
      {
        $set: {
          preferredLabel: {
            [FALLBACK_LANG.dbKeyName]: "English label",
            [SECONDARY_LANG.dbKeyName]: "Libellé français",
          },
          description: { [FALLBACK_LANG.dbKeyName]: "English description only" },
          altLabels: [{ [FALLBACK_LANG.dbKeyName]: "kept" }, { de: "nur Deutsch" }],
        },
      }
    );

    // WHEN requesting the parent's children with Accept-Language: fr
    const givenEvent = {
      httpMethod: "GET",
      headers: { "accept-language": SECONDARY_LANG.shortCode },
      path: `/models/${givenModelId}/occupationGroups/${givenParent.id}/children`,
      pathParameters: { modelId: givenModelId, id: givenParent.id },
    };
    const actualResponse = await occupationGroupChildrenHandler(givenEvent as unknown as APIGatewayProxyEvent);

    // THEN expect OK, the French preferredLabel, description falling back to English for this field only,
    // and the altLabels item untranslated in both languages dropped rather than returned as null
    expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
    expect(actualResponse.headers?.["Content-Language"]).toEqual(SECONDARY_LANG.shortCode);
    const actualBody = JSON.parse(actualResponse.body);
    expect(actualBody.data[0].preferredLabel).toEqual("Libellé français");
    expect(actualBody.data[0].description).toEqual("English description only");
    expect(actualBody.data[0].altLabels).toEqual(["kept"]);
  });
});
