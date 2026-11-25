// silence chatty console
import "_test_utilities/consoleMock";

import * as authenticatorModule from "auth/authorizer";
import * as config from "server/config/config";
import { getRepositoryRegistry } from "server/repositoryRegistry/repositoryRegistry";
import { ModelPATCHHandler } from "./index";
import ModelInfoAPISpecs from "api-specifications/modelInfo";
import LanguageAPISpecs from "api-specifications/language";
import ErrorAPISpecs from "api-specifications/error";
import LocaleAPISpecs from "api-specifications/locale";
import { HTTP_VERBS, StatusCodes } from "server/httpUtils";
import { APIGatewayProxyEvent } from "aws-lambda";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { getIModelInfoMockData } from "../../testDataHelper";
import { IModelInfo, IModelInfoReference } from "../../modelInfo.types";
import { usersRequestContext } from "_test_utilities/dataModel";
import { randomUUID } from "crypto";

const checkRole = jest.spyOn(authenticatorModule, "checkRole");

const givenModelId = getMockStringId(1);

function getEvent(options: { body?: string; modelId?: string | null; contentType?: string }): APIGatewayProxyEvent {
  const modelId = options.modelId === undefined ? givenModelId : options.modelId;
  const path = modelId === null ? "/models" : `/models/${modelId}`;
  return {
    httpMethod: HTTP_VERBS.PATCH,
    path,
    body: options.body ?? JSON.stringify({ released: true }),
    headers: {
      "Content-Type": options.contentType ?? "application/json",
    },
    requestContext: usersRequestContext.MODEL_MANAGER,
  } as never;
}

function getModelInfoRepositoryMock() {
  return {
    Model: undefined as never,
    create: jest.fn(),
    getModelById: jest.fn(),
    getModelByUUID: jest.fn(),
    getModels: jest.fn(),
    getHistory: jest.fn(),
    getModelsByIds: jest.fn(),
    releaseModel: jest.fn(),
    updateAvailableLanguages: jest.fn(),
    patchModel: jest.fn(),
  };
}

describe("Test the ModelPATCHHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkRole.mockResolvedValue(true);
  });

  describe("Authorization & Role", () => {
    test("should respond with FORBIDDEN if the user is not a model manager", async () => {
      // GIVEN the user is not a model manager
      checkRole.mockResolvedValue(false);
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // WHEN the handler is invoked
      const actualResponse = await new ModelPATCHHandler().handle(getEvent({}));

      // THEN expect a FORBIDDEN response
      expect(actualResponse.statusCode).toEqual(StatusCodes.FORBIDDEN);
      // AND expect the repository to not be called
      expect(givenModelInfoRepositoryMock.patchModel).not.toHaveBeenCalled();
      expect(givenModelInfoRepositoryMock.getModelById).not.toHaveBeenCalled();
    });
  });

  describe("Path and Request Validation", () => {
    test("should respond with NOT_FOUND when the modelId in the path is not a valid ObjectId", async () => {
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(getEvent({ modelId: "not-a-valid-object-id" }));

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
      );
      expect(givenModelInfoRepositoryMock.patchModel).not.toHaveBeenCalled();
      expect(givenModelInfoRepositoryMock.getModelById).not.toHaveBeenCalled();
    });

    test("should respond with BAD_REQUEST when the modelId is missing in the path", async () => {
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(getEvent({ modelId: null }));

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
      expect(givenModelInfoRepositoryMock.patchModel).not.toHaveBeenCalled();
    });

    test("should respond with UNSUPPORTED_MEDIA_TYPE when the content type is not json", async () => {
      const actualResponse = await new ModelPATCHHandler().handle(getEvent({ contentType: "text/html" }));
      expect(actualResponse.statusCode).toEqual(StatusCodes.UNSUPPORTED_MEDIA_TYPE);
    });

    test("should respond with TOO_LARGE_PAYLOAD when the payload is too large", async () => {
      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({
          body: JSON.stringify({
            name: "a".repeat(ModelInfoAPISpecs.ModelInfo.PATCH.Constants.MAX_PATCH_PAYLOAD_LENGTH + 1),
          }),
        })
      );
      expect(actualResponse.statusCode).toEqual(StatusCodes.TOO_LARGE_PAYLOAD);
    });

    test("should respond with BAD_REQUEST when the body is malformed", async () => {
      const actualResponse = await new ModelPATCHHandler().handle(getEvent({ body: "{ not json" }));
      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.MALFORMED_BODY);
    });
  });

  describe("Schema Validation", () => {
    test.each([
      ["released is false", { released: false }],
      ["the payload only carries releaseNotes", { releaseNotes: "some notes" }],
      ["the payload asks for nothing", {}],
      ["availableLanguages is empty", { availableLanguages: [] }],
      ["availableLanguages has an unregistered language", { availableLanguages: ["not-a-registered-language"] }],
      ["there is an unknown property", { released: true, foo: "bar" }],
      ["name is empty", { name: "" }],
      ["name exceeds max length", { name: "a".repeat(ModelInfoAPISpecs.Constants.NAME_MAX_LENGTH + 1) }],
      [
        "description exceeds max length",
        { description: "a".repeat(ModelInfoAPISpecs.Constants.DESCRIPTION_MAX_LENGTH + 1) },
      ],
      ["license exceeds max length", { license: "a".repeat(ModelInfoAPISpecs.Constants.LICENSE_MAX_LENGTH + 1) }],
      ["locale is missing required properties", { locale: { shortCode: "en" } }],
      ["UUIDHistory is empty", { UUIDHistory: [] }],
      ["UUIDHistory has invalid UUID", { UUIDHistory: ["not-a-uuid"] }],
      [
        "UUIDHistory has duplicate UUIDs",
        { UUIDHistory: ["a56b6214-5d5e-4c54-9457-41a4a4d6f830", "a56b6214-5d5e-4c54-9457-41a4a4d6f830"] },
      ],
    ])("should respond with BAD_REQUEST when %s", async (_description, givenBody) => {
      const actualResponse = await new ModelPATCHHandler().handle(getEvent({ body: JSON.stringify(givenBody) }));

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(ErrorAPISpecs.Constants.ErrorCodes.INVALID_JSON_SCHEMA);
    });
  });

  describe("Current Model State and Business Rule Validations", () => {
    test("should respond with NOT_FOUND when the model does not exist on initial read", async () => {
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(null);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "New Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
      );
      expect(givenModelInfoRepositoryMock.getModelById).toHaveBeenCalledWith(givenModelId);
      expect(givenModelInfoRepositoryMock.patchModel).not.toHaveBeenCalled();
    });

    test("should respond with BAD_REQUEST when UUIDHistory does not contain current model UUID", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const otherUuid = randomUUID();
      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ UUIDHistory: [otherUuid] }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status400.ErrorCodes.UUID_HISTORY_MUST_INCLUDE_CURRENT_UUID
      );
      expect(givenModelInfoRepositoryMock.patchModel).not.toHaveBeenCalled();
    });

    test("should respond with BAD_REQUEST when availableLanguages drops an existing language", async () => {
      const allRegistered = LanguageAPISpecs.Constants.Languages.map((l) => l.shortCode);
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(),
        id: givenModelId,
        availableLanguages: allRegistered,
      };
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const fallbackOnly = [LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode];
      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ availableLanguages: fallbackOnly }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status400.ErrorCodes.AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED
      );
      expect(givenModelInfoRepositoryMock.patchModel).not.toHaveBeenCalled();
    });

    test.each([
      ["name", { name: "Updated Name" }],
      ["description", { description: "Updated description" }],
      ["locale", { locale: { UUID: randomUUID(), name: "English", shortCode: "en" } }],
      ["license", { license: "MIT" }],
      ["UUIDHistory", { UUIDHistory: ["a56b6214-5d5e-4c54-9457-41a4a4d6f830"] }],
      ["released: true", { released: true }],
    ])(
      "should respond with CONFLICT when attempting to update %s on an already released model",
      async (_desc, payload) => {
        const givenModel: IModelInfo = {
          ...getIModelInfoMockData(),
          id: givenModelId,
          UUID: "a56b6214-5d5e-4c54-9457-41a4a4d6f830",
          released: true,
        };
        const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
        givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
        jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

        const actualResponse = await new ModelPATCHHandler().handle(getEvent({ body: JSON.stringify(payload) }));

        expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
        expect(JSON.parse(actualResponse.body).errorCode).toEqual(
          ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes.MODEL_ALREADY_RELEASED
        );
        expect(givenModelInfoRepositoryMock.patchModel).not.toHaveBeenCalled();
      }
    );

    test("should respond with OK when updating availableLanguages only on an already released model", async () => {
      const fallback = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(),
        id: givenModelId,
        released: true,
        availableLanguages: [fallback],
      };
      const allRegistered = LanguageAPISpecs.Constants.Languages.map((l) => l.shortCode);
      const givenUpdatedModel: IModelInfo = { ...givenModel, availableLanguages: allRegistered };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenUpdatedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ availableLanguages: allRegistered }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, {
        availableLanguages: allRegistered,
      });
      expect(JSON.parse(actualResponse.body).availableLanguages).toEqual(allRegistered);
    });
  });

  describe("Successful Partial Updates (Unreleased Model)", () => {
    const givenResourcesBaseUrl = "https://some/path/to/api/resources";

    beforeEach(() => {
      jest.spyOn(config, "getResourcesBaseUrl").mockReturnValue(givenResourcesBaseUrl);
    });

    test("should respond with OK and update name alone, omitting other fields from spec", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenUpdatedModel: IModelInfo = { ...givenModel, name: "Brand New Name" };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenUpdatedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "Brand New Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, {
        name: "Brand New Name",
      });
      expect(JSON.parse(actualResponse.body).name).toEqual("Brand New Name");
    });

    test("should respond with OK and update description alone, preserving empty string", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenUpdatedModel: IModelInfo = { ...givenModel, description: "" };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenUpdatedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ description: "" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, {
        description: "",
      });
      expect(JSON.parse(actualResponse.body).description).toEqual("");
    });

    test("should respond with OK and update license alone, preserving empty string", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenUpdatedModel: IModelInfo = { ...givenModel, license: "" };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenUpdatedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(getEvent({ body: JSON.stringify({ license: "" }) }));

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, {
        license: "",
      });
      expect(JSON.parse(actualResponse.body).license).toEqual("");
    });

    test("should respond with OK and update locale alone", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenLocale: LocaleAPISpecs.Types.Payload = {
        UUID: randomUUID(),
        name: "Spanish",
        shortCode: "es",
      };
      const givenUpdatedModel: IModelInfo = { ...givenModel, locale: givenLocale };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenUpdatedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ locale: givenLocale }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, {
        locale: givenLocale,
      });
      expect(JSON.parse(actualResponse.body).locale).toEqual(givenLocale);
    });

    test("should respond with OK and update UUIDHistory when it includes current UUID", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const validHistory = [givenModel.UUID, randomUUID()];
      const givenUpdatedModel: IModelInfo = { ...givenModel, UUIDHistory: validHistory };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenUpdatedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ UUIDHistory: validHistory }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, {
        UUIDHistory: validHistory,
      });
      expect(givenModelInfoRepositoryMock.getHistory).toHaveBeenCalledWith(validHistory);
      expect(JSON.parse(actualResponse.body).modelHistory).toEqual([]);
    });

    test("should respond with OK when releasing without releaseNotes", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenReleasedModel: IModelInfo = { ...givenModel, released: true };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenReleasedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ released: true }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, {
        released: true,
      });
      expect(JSON.parse(actualResponse.body).released).toBe(true);
    });

    test("should respond with OK when releasing with releaseNotes", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenReleasedModel: IModelInfo = { ...givenModel, released: true, releaseNotes: "Version 1.0 notes" };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenReleasedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue([]);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ released: true, releaseNotes: "Version 1.0 notes" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, {
        released: true,
        releaseNotes: "Version 1.0 notes",
      });
      expect(JSON.parse(actualResponse.body).released).toBe(true);
      expect(JSON.parse(actualResponse.body).releaseNotes).toBe("Version 1.0 notes");
    });

    test("should respond with OK and apply all metadata, languages, and release atomically", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const allRegistered = LanguageAPISpecs.Constants.Languages.map((l) => l.shortCode);
      const givenLocale: LocaleAPISpecs.Types.Payload = {
        UUID: randomUUID(),
        name: "English",
        shortCode: "en",
      };
      const givenUUIDHistory = [givenModel.UUID, randomUUID()];

      const requestPayload = {
        name: "Atomic Model",
        description: "Atomically updated description",
        locale: givenLocale,
        license: "Apache-2.0",
        UUIDHistory: givenUUIDHistory,
        availableLanguages: allRegistered,
        released: true,
        releaseNotes: "Initial atomic release",
      };

      const givenUpdatedModel: IModelInfo = {
        ...givenModel,
        ...requestPayload,
      };

      const givenUuidHistoryDetails: IModelInfoReference[] = [
        {
          id: givenModelId,
          UUID: givenModel.UUID,
          name: requestPayload.name,
          version: givenModel.version,
          localeShortCode: givenLocale.shortCode,
        },
      ];

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenUpdatedModel);
      givenModelInfoRepositoryMock.getHistory.mockResolvedValue(givenUuidHistoryDetails);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(getEvent({ body: JSON.stringify(requestPayload) }));

      expect(actualResponse.statusCode).toEqual(StatusCodes.OK);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledTimes(1);
      expect(givenModelInfoRepositoryMock.patchModel).toHaveBeenCalledWith(givenModelId, givenModel, requestPayload);
      const responseBody = JSON.parse(actualResponse.body);
      expect(responseBody.name).toEqual("Atomic Model");
      expect(responseBody.released).toBe(true);
      expect(responseBody.releaseNotes).toBe("Initial atomic release");
      expect(responseBody.modelHistory).toEqual(givenUuidHistoryDetails);
    });
  });

  describe("Filter Miss and Re-read Outcomes (Optimistic Concurrency)", () => {
    test("should respond with NOT_FOUND when patchModel misses because the model was concurrently deleted", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      // First read succeeds, patchModel returns null, re-read returns null (deleted)
      givenModelInfoRepositoryMock.getModelById.mockResolvedValueOnce(givenModel).mockResolvedValueOnce(null);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(null);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "Updated Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.NOT_FOUND);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND_BY_ID
      );
    });

    test("should respond with CONFLICT when patchModel misses because the model was concurrently released", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const releasedModel: IModelInfo = { ...givenModel, released: true };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      // First read returns unreleased, patchModel misses, re-read returns released model
      givenModelInfoRepositoryMock.getModelById.mockResolvedValueOnce(givenModel).mockResolvedValueOnce(releasedModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(null);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "Updated Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes.MODEL_ALREADY_RELEASED
      );
    });

    test("should respond with BAD_REQUEST when patchModel misses because concurrent language additions make requested list drop a language", async () => {
      const fallback = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(),
        id: givenModelId,
        released: false,
        availableLanguages: [fallback],
      };
      // Another client concurrently added 'es'
      const concurrentlyUpdatedModel: IModelInfo = {
        ...givenModel,
        availableLanguages: [fallback, "es"],
      };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      // First read: [fallback]; patchModel misses because db filter { availableLanguages: [fallback] } doesn't match [fallback, 'es']
      givenModelInfoRepositoryMock.getModelById
        .mockResolvedValueOnce(givenModel)
        .mockResolvedValueOnce(concurrentlyUpdatedModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(null);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      // Caller only requested [fallback, 'fr'], which would drop 'es'
      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ availableLanguages: [fallback, "fr"] }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.BAD_REQUEST);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status400.ErrorCodes.AVAILABLE_LANGUAGES_REMOVAL_NOT_SUPPORTED
      );
    });

    test("should respond with CONFLICT when patchModel misses because available languages changed concurrently", async () => {
      const fallback = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
      const givenModel: IModelInfo = {
        ...getIModelInfoMockData(),
        id: givenModelId,
        released: false,
        availableLanguages: [fallback],
      };
      const concurrentlyUpdatedModel: IModelInfo = {
        ...givenModel,
        availableLanguages: [fallback, "es"],
      };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById
        .mockResolvedValueOnce(givenModel)
        .mockResolvedValueOnce(concurrentlyUpdatedModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(null);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ availableLanguages: [fallback, "es", "fr"] }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.CONFLICT);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status409.ErrorCodes.MODEL_CONCURRENTLY_MODIFIED
      );
    });

    test("should respond with INTERNAL_SERVER_ERROR when patchModel misses for an unexplained concurrent conflict", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      // First read and re-read return identical unreleased model
      givenModelInfoRepositoryMock.getModelById.mockResolvedValueOnce(givenModel).mockResolvedValueOnce(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(null);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "Updated Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_PATCH_MODEL
      );
    });
  });

  describe("Database Error Handling", () => {
    test("should respond with DB_FAILED_TO_RELEASE_MODEL when a release-only update fails in the DB", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockRejectedValue(new Error("DB failure"));
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ released: true }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RELEASE_MODEL
      );
    });

    test("should respond with DB_FAILED_TO_UPDATE_AVAILABLE_LANGUAGES when a language-only update fails in the DB", async () => {
      const fallback = LanguageAPISpecs.Constants.FALLBACK_LANGUAGE.shortCode;
      const allRegistered = LanguageAPISpecs.Constants.Languages.map((l) => l.shortCode);
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, availableLanguages: [fallback] };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockRejectedValue(new Error("DB failure"));
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ availableLanguages: allRegistered }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_UPDATE_AVAILABLE_LANGUAGES
      );
    });

    test("should respond with DB_FAILED_TO_PATCH_MODEL when a metadata update fails in the DB", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockRejectedValue(new Error("DB failure"));
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "Updated Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_PATCH_MODEL
      );
    });

    test("should respond with INTERNAL_SERVER_ERROR when initial getModelById fails", async () => {
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockRejectedValue(new Error("DB failure"));
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "Updated Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_PATCH_MODEL
      );
    });

    test("should respond with INTERNAL_SERVER_ERROR when diagnostic getModelById fails on filter miss", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById
        .mockResolvedValueOnce(givenModel)
        .mockRejectedValueOnce(new Error("DB failure"));
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(null);
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "Updated Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_PATCH_MODEL
      );
    });

    test("should respond with INTERNAL_SERVER_ERROR when getHistory fails after successful patchModel", async () => {
      const givenModel: IModelInfo = { ...getIModelInfoMockData(), id: givenModelId, released: false };
      const givenUpdatedModel: IModelInfo = { ...givenModel, name: "New Name" };

      const givenModelInfoRepositoryMock = getModelInfoRepositoryMock();
      givenModelInfoRepositoryMock.getModelById.mockResolvedValue(givenModel);
      givenModelInfoRepositoryMock.patchModel.mockResolvedValue(givenUpdatedModel);
      givenModelInfoRepositoryMock.getHistory.mockRejectedValue(new Error("DB failure"));
      jest.spyOn(getRepositoryRegistry(), "modelInfo", "get").mockReturnValue(givenModelInfoRepositoryMock);

      const actualResponse = await new ModelPATCHHandler().handle(
        getEvent({ body: JSON.stringify({ name: "New Name" }) })
      );

      expect(actualResponse.statusCode).toEqual(StatusCodes.INTERNAL_SERVER_ERROR);
      expect(JSON.parse(actualResponse.body).errorCode).toEqual(
        ModelInfoAPISpecs.ModelInfo.PATCH.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_PATCH_MODEL
      );
    });
  });
});
