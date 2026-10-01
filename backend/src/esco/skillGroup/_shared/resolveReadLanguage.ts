import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import ErrorAPISpecs from "api-specifications/error";
import { errorResponseGET, StatusCodes } from "server/httpUtils";
import { getAcceptLanguageHeader, resolveLanguageConfig } from "common/language/resolveLanguage";
import { ModelForSkillGroupValidationErrorCode, ValidateModelForSkillGroupResult } from "./skillGroup.types";

/**
 * The language a skill group read endpoint serves its response in.
 */
export interface ISkillGroupReadLanguage {
  /** The dbKeyName of the language the translatable fields are resolved to. */
  language: string;
  /** The headers of a response served in that language. */
  headers: Record<string, string>;
}

/**
 * The endpoint specific error codes of a skill group read endpoint.
 */
export interface ISkillGroupReadErrorCodes {
  modelNotFound: ErrorAPISpecs.Types.GET["errorCode"];
  dbFailedToRetrieve: ErrorAPISpecs.Types.GET["errorCode"];
}

/**
 * Turns the validation result of the model of a skill group read request into the language the response is served
 * in, resolving the Accept-Language header against the model's available languages, or into the error response
 * when the model does not exist or could not be fetched.
 *
 * A released model is not an error for a read endpoint, it is served in its languages like any other model. A
 * missing, unsupported or malformed Accept-Language header is not an error either, it is served the fall back
 * language.
 */
export function resolveSkillGroupReadLanguage(
  event: APIGatewayProxyEvent,
  validationResult: ValidateModelForSkillGroupResult,
  modelId: string,
  errorCodes: ISkillGroupReadErrorCodes
): ISkillGroupReadLanguage | APIGatewayProxyResult {
  if (validationResult.errorCode === ModelForSkillGroupValidationErrorCode.MODEL_NOT_FOUND_BY_ID) {
    return errorResponseGET(
      StatusCodes.NOT_FOUND,
      errorCodes.modelNotFound,
      "Model not found",
      `No model found with id: ${modelId}`
    );
  }
  if (validationResult.errorCode === ModelForSkillGroupValidationErrorCode.FAILED_TO_FETCH_FROM_DB) {
    return errorResponseGET(
      StatusCodes.INTERNAL_SERVER_ERROR,
      errorCodes.dbFailedToRetrieve,
      "Failed to fetch the model details from the DB",
      ""
    );
  }
  const languageConfig = resolveLanguageConfig(
    getAcceptLanguageHeader(event.headers),
    validationResult.availableLanguages
  );
  return {
    language: languageConfig.dbKeyName,
    headers: {
      "Content-Type": "application/json",
      "Content-Language": languageConfig.shortCode,
      Vary: "Accept-Language",
    },
  };
}
