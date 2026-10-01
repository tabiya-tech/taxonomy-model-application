import "_test_utilities/consoleMock";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import SkillGroupAPISpecs from "api-specifications/esco/skillGroup";
import { StatusCodes } from "server/httpUtils";
import { getMockStringId } from "_test_utilities/mockMongoId";
import { ISkillGroupReadLanguage, resolveSkillGroupReadLanguage } from "./resolveReadLanguage";
import { ModelForSkillGroupValidationErrorCode, ValidateModelForSkillGroupResult } from "./skillGroup.types";
import {
  acceptLanguageHeaders,
  FALLBACK_LANGUAGE,
  LANGUAGE_NEGOTIATION_CASES,
  MODEL_LANGUAGES,
  SECONDARY_LANGUAGE,
} from "../_test_utilities/languageNegotiationCases";

describe("Test resolveSkillGroupReadLanguage()", () => {
  const givenModelId = getMockStringId(1);
  const givenErrorCodes = {
    modelNotFound: SkillGroupAPISpecs.GET.Enums.Response.Status404.ErrorCodes.MODEL_NOT_FOUND,
    dbFailedToRetrieve: SkillGroupAPISpecs.GET.Enums.Response.Status500.ErrorCodes.DB_FAILED_TO_RETRIEVE_SKILL_GROUPS,
  };

  function givenEventWithAcceptLanguage(acceptLanguage: string | undefined): APIGatewayProxyEvent {
    return { headers: acceptLanguageHeaders(acceptLanguage) } as unknown as APIGatewayProxyEvent;
  }

  test.each(LANGUAGE_NEGOTIATION_CASES)(
    "should serve a model's response in the negotiated language when the request carries %s",
    (_description, givenAcceptLanguage, expectedLanguage) => {
      // GIVEN a model available in the fallback and a secondary language
      const givenValidationResult: ValidateModelForSkillGroupResult = {
        errorCode: null,
        availableLanguages: MODEL_LANGUAGES,
      };
      // AND a request with the given Accept-Language header
      const givenEvent = givenEventWithAcceptLanguage(givenAcceptLanguage);

      // WHEN resolving the language of the response
      const actualReadLanguage = resolveSkillGroupReadLanguage(
        givenEvent,
        givenValidationResult,
        givenModelId,
        givenErrorCodes
      );

      // THEN expect the negotiated language and the headers of a response served in it
      const expectedReadLanguage: ISkillGroupReadLanguage = {
        language: expectedLanguage.dbKeyName,
        headers: {
          "Content-Type": "application/json",
          "Content-Language": expectedLanguage.shortCode,
          Vary: "Accept-Language",
        },
      };
      expect(actualReadLanguage).toEqual(expectedReadLanguage);
    }
  );

  test("should serve a released model's response in its languages, a released model is not an error for a read", () => {
    // GIVEN a released model available in the fallback and a secondary language
    const givenValidationResult: ValidateModelForSkillGroupResult = {
      errorCode: ModelForSkillGroupValidationErrorCode.MODEL_IS_RELEASED,
      availableLanguages: MODEL_LANGUAGES,
    };
    // AND a request for the secondary language
    const givenEvent = givenEventWithAcceptLanguage(SECONDARY_LANGUAGE.shortCode);

    // WHEN resolving the language of the response
    const actualReadLanguage = resolveSkillGroupReadLanguage(
      givenEvent,
      givenValidationResult,
      givenModelId,
      givenErrorCodes
    );

    // THEN expect the secondary language
    expect((actualReadLanguage as ISkillGroupReadLanguage).language).toEqual(SECONDARY_LANGUAGE.dbKeyName);
  });

  test("should serve the fallback language when the model has no languages", () => {
    // GIVEN a model that declares no languages
    const givenValidationResult: ValidateModelForSkillGroupResult = { errorCode: null, availableLanguages: [] };
    // AND a request for the secondary language
    const givenEvent = givenEventWithAcceptLanguage(SECONDARY_LANGUAGE.shortCode);

    // WHEN resolving the language of the response
    const actualReadLanguage = resolveSkillGroupReadLanguage(
      givenEvent,
      givenValidationResult,
      givenModelId,
      givenErrorCodes
    );

    // THEN expect the fallback language
    expect((actualReadLanguage as ISkillGroupReadLanguage).language).toEqual(FALLBACK_LANGUAGE.dbKeyName);
  });

  test.each([
    [
      "NOT_FOUND with the endpoint's model not found code when the model does not exist",
      ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID,
      StatusCodes.NOT_FOUND,
      {
        errorCode: givenErrorCodes.modelNotFound,
        message: "Model not found",
        details: `No model found with id: ${givenModelId}`,
      },
    ],
    [
      "INTERNAL_SERVER_ERROR with the endpoint's DB failure code when the model could not be fetched",
      ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB,
      StatusCodes.INTERNAL_SERVER_ERROR,
      {
        errorCode: givenErrorCodes.dbFailedToRetrieve,
        message: "Failed to fetch the model details from the DB",
        details: "",
      },
    ],
  ] as const)(
    "should respond with %s",
    (_description, givenErrorCode, expectedStatusCode, expectedErrorBody: ErrorAPISpecs.Types.GET) => {
      // GIVEN the validation of the model failed with the given error code
      const givenValidationResult: ValidateModelForSkillGroupResult = { errorCode: givenErrorCode };

      // WHEN resolving the language of the response
      const actualResult = resolveSkillGroupReadLanguage(
        givenEventWithAcceptLanguage(undefined),
        givenValidationResult,
        givenModelId,
        givenErrorCodes
      ) as APIGatewayProxyResult;

      // THEN expect the error response
      expect(actualResult.statusCode).toEqual(expectedStatusCode);
      expect(JSON.parse(actualResult.body)).toEqual(expectedErrorBody);
    }
  );
});
